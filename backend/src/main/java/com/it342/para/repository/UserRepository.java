package com.it342.para.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.it342.para.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    User findByEmail(String email);
}