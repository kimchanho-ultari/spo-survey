package com.ultari.additional.service;

import com.ultari.additional.domain.organization.User;
import com.ultari.additional.domain.reaction.ContentReaction;
import com.ultari.additional.domain.reaction.ContentReactionCount;
import com.ultari.additional.mapper.common.OrganizationMapper;
import com.ultari.additional.mapper.common.ReactionMapper;
import com.ultari.additional.util.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ReactionService {

    @Autowired
    ReactionMapper reactionMapper;

    @Autowired
    OrganizationMapper organizationMapper;

    @Transactional
    public JSONArray getContentReaction(String contentId) {
        ContentReactionCount reactions = new ContentReactionCount();

        List<Map<String, String>> list = reactionMapper.findReactionCountByContentId(contentId);
        for(Map<String, String> map:list){
            String name = map.get("name");
            String count = map.get("cnt");

            reactions.setReactionCount(name, count);
        }
        JSONArray arr = reactions.getJsonArrayCount();
        arr.put(new JSONObject("{\"total\":\""+reactions.getTotalCount()+"\"}"));

        return arr;
    }

    @Transactional
    public JSONArray getContentReactionList(String contentId, String key) throws Exception {
        JSONArray arr = new JSONArray();
        List<Map<String, String>> list = reactionMapper.findReactionListByContentIdAndReaction(contentId, key);
        for(Map<String, String> map:list){
            JSONObject json = new JSONObject();
            String userId = map.get("userId");

            User user = organizationMapper.memberById(userId);
            if(user!=null) {
                json.put("userName",user.getUserName());
                json.put("deptName",user.getDeptName());
                json.put("posName",user.getPosName());
                json.put("reactionId",map.get("reactionId"));
                json.put("contentId",map.get("contentId"));
                json.put("userId",map.get("userId"));
                json.put("reaction",map.get("reactionType"));
                json.put("registDate",map.get("registDate"));

                arr.put(json);
            }
        }

        return arr;
    }

    @Transactional
    public JSONArray getContentReactionTotalList(String contentId, String key) throws Exception {
        JSONArray arr = new JSONArray();
        List<Map<String, String>> list = reactionMapper.findReactionTotalListByContentIdAndReaction(contentId);
        for(Map<String, String> map:list){
            JSONObject json = new JSONObject();
            String userId = map.get("userId");

            User user = organizationMapper.memberById(userId);
            if(user!=null) {
                json.put("userName",user.getUserName());
                json.put("deptName",user.getDeptName());
                json.put("posName",user.getPosName());
                json.put("reactionId",map.get("reactionId"));
                json.put("contentId",map.get("contentId"));
                json.put("userId",map.get("userId"));
                json.put("reaction",map.get("reactionType"));
                json.put("registDate",map.get("registDate"));

                arr.put(json);
            }
        }

        return arr;
    }

    public void saveReaction(ContentReaction reaction) {
        reactionMapper.saveReaction(StringUtil.uuid(), reaction.getContentId(), reaction.getUserId(), reaction.getReaction());
    }

    public void removeReaction(ContentReaction reaction) {
        reactionMapper.removeReaction(reaction.getContentId(), reaction.getUserId());
    }
}
