package com.bartr.matching.application.scheduler;

import com.bartr.matching.application.service.UserSyncService;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@AllArgsConstructor
public class UserSyncScheduler {

    private UserSyncService userSyncService;

    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void syncUsers(){
        log.info("Users synced");
        userSyncService.syncUsers();
    }

    @PostConstruct
    public void initSync(){
        syncUsers();
    }
}
