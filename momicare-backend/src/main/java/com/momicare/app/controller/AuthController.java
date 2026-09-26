package com.momicare.app.controller;

import com.momicare.app.dto.*;
import com.momicare.app.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Patient self-registration. Body: { name, phoneNumber }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    /**
     * POST /api/auth/login-by-phone
     * Patient phone-only login. Body: { phoneNumber }
     * NOTE: No OTP in MVP — needs proper verification before production.
     */
    @PostMapping("/login-by-phone")
    public ResponseEntity<AuthResponse> loginByPhone(@Valid @RequestBody PhoneLoginRequest req) {
        return ResponseEntity.ok(authService.loginByPhone(req));
    }

    /**
     * POST /api/auth/login
     * Staff login (nurse/doctor/admin). Body: { username, password }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody StaffLoginRequest req) {
        return ResponseEntity.ok(authService.loginStaff(req));
    }
}
