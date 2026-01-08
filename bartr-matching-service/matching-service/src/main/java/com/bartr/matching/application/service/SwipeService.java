package com.bartr.matching.application.service;

import com.bartr.common.core.exception.ErrorConstant;
import com.bartr.common.core.exception.ServiceException;
import com.bartr.matching.MatchDto;
import com.bartr.matching.SwipeAction;
import com.bartr.matching.UserServiceClient;
import com.bartr.matching.domain.entity.MatchHistory;
import com.bartr.matching.domain.entity.SwipeHistory;
import com.bartr.matching.domain.repositories.MatchHistoryRepository;
import com.bartr.matching.domain.repositories.SwipeHistoryRepository;
import com.bartr.matching.request.SwipeRequest;
import com.bartr.matching.response.SwipeResponse;
import com.bartr.matching.utility.EventProducerUtility;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
public class SwipeService {
    private SwipeHistoryRepository swipeHistoryRepository;
    private MatchHistoryRepository matchHistoryRepository;
    private EventProducerUtility eventProducerUtility;
    private UserServiceClient userServiceClient;

    @Transactional
    public SwipeResponse swipe(SwipeRequest request){
        if (request == null) {
            throw new ServiceException("40000001", "SwipeRequest cannot be null", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        if (request.getUserId() == null || request.getSwipedUserId() == null) {
            throw new ServiceException("40000002", "UserId and SwipedUserId cannot be null", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        if (request.getAction() == null || request.getAction().trim().isEmpty()) {
            throw new ServiceException("40000003", "Action cannot be null or empty", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        
        log.info("Processing swipe request - userId: {}, swipedUserId: {}, action: {}", 
                request.getUserId(), request.getSwipedUserId(), request.getAction());
        
        try {
            LocalDate today = LocalDate.now();
            List<SwipeHistory> swipesToday = swipeHistoryRepository.findByUserIdAndSwipeDate(request.getUserId(), today);

            if(swipesToday.size() >= 20){
                throw new ServiceException("40000004", "Daily swipe limit reached", 
                        ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
            }

            // Check if user already swiped on this profile
            Optional<SwipeHistory> existingSwipe = swipeHistoryRepository
                    .findByUserIdAndSwipedUserId(request.getUserId(), request.getSwipedUserId());
            
            if(existingSwipe.isPresent()){
                // User already swiped on this profile, return existing response
                SwipeHistory existing = existingSwipe.get();
                if(existing.getAction().equalsIgnoreCase(SwipeAction.LEFT.getAction())){
                    return SwipeResponse.builder()
                            .matched(false)
                            .matchDto(null)
                            .build();
                }
                // If it was a right swipe, check for match
                Optional<SwipeHistory> oppositeSwipe = swipeHistoryRepository
                        .findByUserIdAndSwipedUserId(request.getSwipedUserId(), request.getUserId());
                if(oppositeSwipe.isPresent() && oppositeSwipe.get().getAction().equalsIgnoreCase(SwipeAction.RIGHT.getAction())){
                    if(!alreadyMatched(request.getUserId(), request.getSwipedUserId())){
                        // Create match history
                        MatchHistory matchHistory = MatchHistory.builder()
                                .matchedDate(LocalDate.now())
                                .user1Id(request.getUserId())
                                .user2Id(request.getSwipedUserId())
                                .build();
                        matchHistoryRepository.save(matchHistory);
                        try {
                            eventProducerUtility.sendMatchEvent(request.getUserId(), request.getSwipedUserId());
                        } catch (Exception e) {
                            log.warn("Failed to send match event to Kafka: {}", e.getMessage());
                            // Don't fail the swipe if event sending fails
                        }
                        
                        return SwipeResponse.builder()
                                .matched(true)
                                .matchDto(MatchDto.builder()
                                        .matchedDate(LocalDate.now())
                                        .user1Id(request.getUserId())
                                        .user2Id(request.getSwipedUserId())
                                        .build())
                                .build();
                    }
                }
                return SwipeResponse.builder()
                        .matched(false)
                        .matchDto(null)
                        .build();
            }

            SwipeHistory history = new SwipeHistory();
            history.setSwipeDate(today);
            history.setAction(request.getAction());
            history.setUserId(request.getUserId());
            history.setSwipedUserId(request.getSwipedUserId());

            try {
                swipeHistoryRepository.save(history);
            } catch (DataIntegrityViolationException e) {
                // Handle duplicate key violation - this should only happen if user tries to swipe on same person twice
                // (due to unique constraint on userId + swipedUserId)
                log.warn("Duplicate swipe detected (user already swiped on this person): userId={}, swipedUserId={}", 
                        request.getUserId(), request.getSwipedUserId());
                // Check if the swipe was actually saved by another concurrent request
                Optional<SwipeHistory> savedSwipe = swipeHistoryRepository
                        .findByUserIdAndSwipedUserId(request.getUserId(), request.getSwipedUserId());
                if (savedSwipe.isPresent()) {
                    // Swipe already exists (concurrent request or duplicate), use existing record
                    history = savedSwipe.get();
                    log.info("Using existing swipe record for userId={}, swipedUserId={}", 
                            request.getUserId(), request.getSwipedUserId());
                } else {
                    // This shouldn't happen with correct constraint, but handle gracefully
                    log.error("Unexpected constraint violation. Error: {}", e.getMessage());
                    // Return a response as if the swipe was processed (to prevent UI errors)
                    return SwipeResponse.builder()
                            .matched(false)
                            .matchDto(null)
                            .build();
                }
            }

            if(request.getAction().equalsIgnoreCase(SwipeAction.LEFT.getAction())){
                return SwipeResponse.builder()
                        .matched(false)
                        .matchDto(null)
                        .build();
            }

            // Give 1 credit for swiping right
            try {
                userServiceClient.addCredits(request.getUserId(), 1);
                log.info("Added 1 credit to user {} for swiping right", request.getUserId());
            } catch (Exception e) {
                log.warn("Failed to add credits for swipe: {}", e.getMessage());
                // Don't fail the swipe if credits update fails
            }

            Optional<SwipeHistory> oppositeSwipe = swipeHistoryRepository
                    .findByUserIdAndSwipedUserId(request.getSwipedUserId(), request.getUserId());

            if(oppositeSwipe.isPresent() && oppositeSwipe.get().getAction().equalsIgnoreCase(SwipeAction.RIGHT.getAction())){

                if(!alreadyMatched(request.getSwipedUserId(), request.getUserId())){

                    MatchHistory matchHistory = MatchHistory.builder()
                            .matchedDate(LocalDate.now())
                            .user1Id(request.getUserId())
                            .user2Id(request.getSwipedUserId())
                            .build();
                    matchHistoryRepository.save(matchHistory);

                    try {
                        eventProducerUtility.sendMatchEvent(request.getUserId(), request.getSwipedUserId());
                    } catch (Exception e) {
                        log.warn("Failed to send match event to Kafka: {}", e.getMessage());
                        // Don't fail the swipe if event sending fails
                    }

                    return SwipeResponse.builder()
                            .matchDto(MatchDto.builder()
                                    .matchedDate(LocalDate.now())
                                    .user1Id(request.getUserId())
                                    .user2Id(request.getSwipedUserId())
                                    .build())
                            .matched(true)
                            .build();
                }
            }

            return SwipeResponse.builder()
                    .matchDto(null)
                    .matched(false)
                    .build();
        } catch (ServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing swipe request: {}", e.getMessage(), e);
            throw new ServiceException("50000001", "Failed to process swipe: " + e.getMessage(), 
                    ErrorConstant.CATEGORY.TS, ErrorConstant.SEVERITY.C, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private boolean alreadyMatched(UUID user1Id, UUID user2Id) {
        // Check if match exists in either direction (user1-user2 or user2-user1)
        return matchHistoryRepository.existsByUser1IdAndUser2Id(user1Id, user2Id) ||
                matchHistoryRepository.existsByUser1IdAndUser2Id(user2Id, user1Id);
    }
}
