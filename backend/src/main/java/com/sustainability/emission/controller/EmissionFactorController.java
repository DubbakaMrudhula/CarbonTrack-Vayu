package com.sustainability.emission.controller;

import com.sustainability.emission.dto.EmissionFactorResponse;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.service.EmissionFactorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/emission-factors")
public class EmissionFactorController {

    private final EmissionFactorService emissionFactorService;

    public EmissionFactorController(EmissionFactorService emissionFactorService) {
        this.emissionFactorService = emissionFactorService;
    }

    @GetMapping
    public ResponseEntity<List<EmissionFactorResponse>> getEmissionFactors(
        @RequestParam(required = false) ActivityCategory category
    ) {
        List<EmissionFactorResponse> response = emissionFactorService.listActiveFactors(category);
        return ResponseEntity.ok(response);
    }
}

