package com.ultari.additional.service;

import com.ultari.additional.domain.organization.User;
import com.ultari.additional.domain.reply.Reply;
import com.ultari.additional.mapper.common.OrganizationMapper;
import com.ultari.additional.mapper.common.ReplyMapper;
import com.ultari.additional.util.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class ReplyService {

    @Autowired
    ReplyMapper replyMapper;

    @Autowired
    OrganizationMapper organizationMapper;

    @Transactional
    public JSONArray getReplyList(String contentId, String myUserId) throws Exception {
        JSONArray arr = new JSONArray();

        List<Reply> list = replyMapper.findByContentIdOrderByRegistDateAsc(contentId);
        for(Reply reply:list){
            String userName = "UNKNOWN";
            User user = organizationMapper.memberById(reply.getUserId());
            String userId = reply.getUserId();
            if(user!=null) {
                userName = user.getUserName();
                userId = user.getUserId();
            }

            JSONObject json = new JSONObject();
            json.put("replyId",reply.getReplyId());
            json.put("contentId",reply.getContentId());
            json.put("userId",userId);
            json.put("reply",reply.getReply());
            json.put("registDate", StringUtil.castNowDate(reply.getRegistDate()));
            json.put("userName", userName);
            json.put("myReply",false);
            if(userId.equals(myUserId)) json.put("myReply",true);

            arr.put(json);
        }
        return arr;
    }

    @Transactional
    public boolean uploadReply(Reply reply) {
        if(ObjectUtils.isEmpty(reply.getReplyId())) {
            reply.setReplyId(StringUtil.uuid());
            //reply.setRegistDate(LocalDateTime.now());
            reply.setReply(reply.getReply());
            replyMapper.save(reply);
        }else{
            reply.setReply(reply.getReply());
            replyMapper.save(reply);
        }

        return true;
    }

    @Transactional
    public boolean deleteReply(Reply dto) {
        Reply contentReply = replyMapper.findByReplyIdAndUserId(dto.getReplyId(), dto.getUserId());
        if(contentReply==null) return false;

        replyMapper.deleteByReplyId(dto.getReplyId());
        return true;
    }
}
