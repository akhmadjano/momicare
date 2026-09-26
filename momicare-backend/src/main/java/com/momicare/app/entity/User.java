package com.momicare.app.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    /** Only used when role=patient — their login identifier */
    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    /** Only for nurse/doctor/admin */
    @Column(unique = true)
    private String username;

    /** BCrypt hash, only for nurse/doctor/admin; null for patients */
    @Column(name = "password_hash")
    private String passwordHash;

    public enum Role {
        patient, nurse, doctor, admin
    }
}
