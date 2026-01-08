package com.bartr.chat;

import com.bartr.common.feign.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "matching-service", url = "${feign.client.matching-service.url}",
    configuration = FeignClientConfig.class)
public interface MatchingServiceClient {

    @GetMapping("/v1/matches/history")
    List<Map<String, Object>> getMatchHistory(@RequestParam("keycloakId") String keycloakId);
}

