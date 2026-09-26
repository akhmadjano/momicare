package com.momicare.app.security;

import com.momicare.app.entity.Patient;
import com.momicare.app.entity.User;
import com.momicare.app.repository.PatientRepository;
import com.momicare.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepo;
    private final PatientRepository patientRepo;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        Long patientId = resolvePatientId(user);
        return new AppUserDetails(user, patientId);
    }

    @Transactional(readOnly = true)
    public AppUserDetails loadByUserId(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        Long patientId = resolvePatientId(user);
        return new AppUserDetails(user, patientId);
    }

    private Long resolvePatientId(User user) {
        if (user.getRole() == User.Role.patient) {
            return patientRepo.findByUser(user).map(Patient::getId).orElse(null);
        }
        return null;
    }
}
