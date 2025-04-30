package com.ultari.additional.mapper.common;

import com.ultari.additional.domain.reply.Reply;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ReplyMapper {
    List<Reply> findByContentIdOrderByRegistDateAsc(String contentId);

    Reply findByReplyIdAndUserId(String replyId, String userId);

    void deleteByReplyId(String replyId);

    void save(Reply reply);
}
