package com.momicare.app.repository;

import com.momicare.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByUsername(String username);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByUsername(String username);
    List<User> findByRole(User.Role role);
}
