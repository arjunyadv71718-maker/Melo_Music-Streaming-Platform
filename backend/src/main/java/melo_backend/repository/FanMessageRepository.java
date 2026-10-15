package melo_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import melo_backend.model.FanMessage;

public interface FanMessageRepository extends JpaRepository<FanMessage, Long> {
    List<FanMessage> findByArtistIgnoreCaseOrderByCreatedAtDesc(String artist);
    List<FanMessage> findAllByOrderByCreatedAtDesc();
}
