package melo_backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "music")
public class Music {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String artist;

    private String album;

    private String genre;

    private String status;

    private String fileName;

    private String filePath;

    private String coverFileName;

    private String coverFilePath;

    /*
     * =========================================
     * PERFORMANCE DATA
     * =========================================
     */

    private long streams = 0;

    private long likes = 0;


    /*
     * =========================================
     * DEFAULT CONSTRUCTOR
     * =========================================
     */

    public Music() {
    }


    /*
     * =========================================
     * CONSTRUCTOR
     * =========================================
     */

    public Music(
            String title,
            String artist,
            String album,
            String genre,
            String status
    ) {

        this.title = title;
        this.artist = artist;
        this.album = album;
        this.genre = genre;
        this.status = status;

        this.streams = 0;
        this.likes = 0;
    }


    /*
     * =========================================
     * GETTERS AND SETTERS
     * =========================================
     */

    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }


    public String getTitle() {
        return title;
    }


    public void setTitle(String title) {
        this.title = title;
    }


    public String getArtist() {
        return artist;
    }


    public void setArtist(String artist) {
        this.artist = artist;
    }


    public String getAlbum() {
        return album;
    }


    public void setAlbum(String album) {
        this.album = album;
    }


    public String getGenre() {
        return genre;
    }


    public void setGenre(String genre) {
        this.genre = genre;
    }


    public String getStatus() {
        return status;
    }


    public void setStatus(String status) {
        this.status = status;
    }


    public String getFileName() {
        return fileName;
    }


    public void setFileName(String fileName) {
        this.fileName = fileName;
    }


    public String getFilePath() {
        return filePath;
    }


    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }


    public String getCoverFileName() {
        return coverFileName;
    }


    public void setCoverFileName(String coverFileName) {
        this.coverFileName = coverFileName;
    }


    public String getCoverFilePath() {
        return coverFilePath;
    }


    public void setCoverFilePath(String coverFilePath) {
        this.coverFilePath = coverFilePath;
    }


    /*
     * =========================================
     * STREAMS
     * =========================================
     */

    public long getStreams() {
        return streams;
    }


    public void setStreams(long streams) {
        this.streams = streams;
    }


    /*
     * =========================================
     * LIKES
     * =========================================
     */

    public long getLikes() {
        return likes;
    }


    public void setLikes(long likes) {
        this.likes = likes;
    }

}