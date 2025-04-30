package com.ultari.additional.domain.reaction;

import lombok.Data;

@Data
public class ContentReaction {
    private String reactionId;
    private String contentId;
    private String userId;
    private String reaction;
}
