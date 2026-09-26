package com.momicare.app.service;

import com.momicare.app.dto.*;
import com.momicare.app.entity.Patient;
import com.momicare.app.entity.User;
import com.momicare.app.repository.PatientRepository;
import com.momicare.app.repository.UserRepository;
import com.momicare.app.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final PatientRepository patientRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    /**
     * Patient self-registration: creates a User (role=patient) + linked Patient row.
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByPhoneNumber(req.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number already registered");
        }

        User user = userRepo.save(User.builder()
                .name(req.getName())
                .role(User.Role.patient)
                .phoneNumber(req.getPhoneNumber())
                .build());

        Patient patient = patientRepo.save(Patient.builder()
                .user(user)
                .name(req.getName())
                .phoneNumber(req.getPhoneNumber())
                .build());

        String token = jwtUtils.generateToken(user.getId(), user.getRole().name(), patient.getId());
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .userId(user.getId())
                .patientId(patient.getId())
                .build();
    }

    /**
     * Patient phone-only login (no password for MVP — needs OTP before production).
     */
    @Transactional(readOnly = true)
    public AuthResponse loginByPhone(PhoneLoginRequest req) {
        User user = userRepo.findByPhoneNumber(req.getPhoneNumber())
                .filter(u -> u.getRole() == User.Role.patient)
                .orElseThrow(() -> new IllegalArgumentException("No patient found with that phone number"));

        Patient patient = patientRepo.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("Patient record not found for user"));

        String token = jwtUtils.generateToken(user.getId(), user.getRole().name(), patient.getId());
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .userId(user.getId())
                .patientId(patient.getId())
                .build();
    }

    /**
     * Username/password login for nurse, doctor, admin.
     */
    @Transactional(readOnly = true)
    public AuthResponse loginStaff(StaffLoginRequest req) {
        User user = userRepo.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (user.getRole() == User.Role.patient) {
            throw new IllegalArgumentException("Patients must use phone login");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtUtils.generateToken(user.getId(), user.getRole().name(), null);
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }
}
