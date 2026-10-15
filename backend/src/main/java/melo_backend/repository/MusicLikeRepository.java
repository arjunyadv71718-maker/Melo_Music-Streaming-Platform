package melo_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import melo_backend.model.MusicLike;

public interface MusicLikeRepository
        extends JpaRepository<MusicLike, Long> {

    Optional<MusicLike> findByMusicIdAndUserEmail(
            Long musicId,
            String userEmail
    );

    long countByMusicId(Long musicId);
}
