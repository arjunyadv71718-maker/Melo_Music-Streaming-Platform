package melo_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "music_likes",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_music_like_email_song",
            columnNames = {"music_id", "user_email"}
        )
    }
)
public class MusicLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "music_id", nullable = false)
    private Long musicId;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    public MusicLike() {
    }

    public MusicLike(Long musicId, String userEmail) {
        this.musicId = musicId;
        this.userEmail = userEmail;
    }

    public Long getId() {
        return id;
    }

    public Long getMusicId() {
        return musicId;
    }

    public void setMusicId(Long musicId) {
        this.musicId = musicId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
}
