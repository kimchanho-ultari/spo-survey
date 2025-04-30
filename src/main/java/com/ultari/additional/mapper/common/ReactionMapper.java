package com.ultari.additional.mapper.common;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ReactionMapper {
    List<Map<String, String>> findReactionCountByContentId(@Param("contentId") String contentId);

    List<Map<String, String>> findReactionListByContentIdAndReaction(@Param("contentId") String contentId, @Param("reactionType") String reactionType);

    List<Map<String, String>> findReactionTotalListByContentIdAndReaction(@Param("contentId") String contentId);

    void saveReaction(@Param("reactionId") String reactionId, @Param("contentId") String contentId, @Param("userId") String userId, @Param("reactionType") String reactionType);

    void removeReaction(@Param("contentId") String contentId, @Param("userId") String userId);
}
