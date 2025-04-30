package com.ultari.additional.domain.reply;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Reply {
    private String replyId;
    private String contentId;
    private String userId;
    private String reply;
    private LocalDateTime registDate;
}
