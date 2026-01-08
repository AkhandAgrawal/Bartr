package com.bartr.chat;

import com.bartr.common.feign.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;
import java.util.Map;

@FeignClient(name = "user-service", url = "${feign.client.user-service.url}",
    configuration = FeignClientConfig.class)
public interface UserServiceClient {

    @PostMapping("/v1/user/profile/credits/add")
    Map<String, Object> addCredits(@RequestParam(name = "keycloakId") UUID keycloakId, @RequestParam(name = "amount") int amount);
}

