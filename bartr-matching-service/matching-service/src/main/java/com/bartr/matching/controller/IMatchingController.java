package com.bartr.matching.controller;

import com.bartr.matching.UserDocument;
import com.bartr.matching.request.SwipeRequest;
import com.bartr.matching.response.SwipeResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequestMapping("/v1")
public interface IMatchingController {

    @GetMapping("/matches/top")
    public List<UserDocument> getPersonalizedProfiles(@RequestParam(name = "keycloakId") UUID keycloakId);

    @PostMapping("/swipe")
    public SwipeResponse swipe(@Valid @RequestBody SwipeRequest request);

    @GetMapping("/stats/matches")
    public Long getMatchesCount();

    @PostMapping("/sync/user")
    public String syncUser(@RequestParam(name = "keycloakId") UUID keycloakId);

    @GetMapping("/matches/history")
    public List<com.bartr.matching.response.MatchHistoryResponse> getMatchHistory(@RequestParam(name = "keycloakId") UUID keycloakId);

    @DeleteMapping("/matches/unmatch")
    public void unmatch(@RequestParam(name = "user1Id") UUID user1Id, @RequestParam(name = "user2Id") UUID user2Id);

}
