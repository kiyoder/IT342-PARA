package com.it342.para.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.it342.para.model.SavedRoute;
import com.it342.para.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedRouteRepository extends JpaRepository<SavedRoute, Long> {
    /**
     * Find all saved routes for a specific user
     * 
     * @param user The user to search for
     * @return List of saved routes
     */
    List<SavedRoute> findByUser(User user);

    /**
     * Find a saved route by user and relation ID
     * 
     * @param user       The user
     * @param relationId The relation ID
     * @return Optional containing the saved route if found
     */
    Optional<SavedRoute> findByUserAndRelationId(User user, String relationId);

    /**
     * Delete a saved route by user and relation ID
     * 
     * @param user       The user
     * @param relationId The relation ID
     */
    void deleteByUserAndRelationId(User user, String relationId);
}
