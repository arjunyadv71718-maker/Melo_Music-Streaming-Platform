package melo_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import melo_backend.model.Music;

public interface MusicRepository extends JpaRepository<Music, Long> {
}