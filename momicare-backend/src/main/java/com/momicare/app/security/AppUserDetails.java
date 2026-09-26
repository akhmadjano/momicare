package com.momicare.app.security;

import com.momicare.app.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Spring Security UserDetails wrapper around our User entity.
 */
@Getter
public class AppUserDetails implements UserDetails {

    private final Long userId;
    private final String role;
    private final Long patientId;   // non-null only for role=patient
    private final String password;
    private final String username;

    public AppUserDetails(User user, Long patientId) {
        this.userId    = user.getId();
        this.role      = user.getRole().name();
        this.patientId = patientId;
        this.password  = user.getPasswordHash() != null ? user.getPasswordHash() : "";
        this.username  = user.getUsername() != null ? user.getUsername() : user.getPhoneNumber();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
    }

    @Override public String getPassword()  { return password; }
    @Override public String getUsername()  { return username; }
    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()              { return true; }
}
