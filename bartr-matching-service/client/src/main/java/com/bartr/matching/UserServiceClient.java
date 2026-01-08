package com.bartr.matching;

import com.bartr.common.feign.FeignClientConfig;
import com.bartr.matching.response.UserProfileDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "user-service", url = "${feign.client.user-service.url}"
    ,configuration = FeignClientConfig.class)
public interface UserServiceClient {

    @GetMapping("/v1/user/profile/all")
    Page<UserProfileDto> getAllUsers(Pageable pageable);

    @GetMapping("/v1/user/profile")
    UserProfileDto getUserProfileByKeycloakId(@RequestParam(name = "keycloakId") UUID keycloakId);

    @PostMapping("/v1/user/profile/credits/add")
    UserProfileDto addCredits(@RequestParam(name = "keycloakId") UUID keycloakId, @RequestParam(name = "amount") int amount);
}
