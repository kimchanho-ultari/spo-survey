package com.ultari.additional.controller;

import com.ultari.additional.domain.account.Account;
import com.ultari.additional.domain.reply.Reply;
import com.ultari.additional.service.ReplyService;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

@Slf4j
@Controller
public class ReplyController {
    @Autowired
    ReplyService replyService;

    @PostMapping("contentreply/list")
    @ResponseBody
    public String contentReplyList(HttpSession session, @RequestParam("contentId") String contentId) throws Exception {
        Account account = (Account) session.getAttribute("account");
        String key = account.getKey();
        JSONObject json = new JSONObject();
        JSONArray arr = replyService.getReplyList(contentId,key);
        json.put("list",arr);
        return json.toString();
    }

    @PostMapping("contentreply/upload")
    @ResponseBody
    public ResponseEntity<String> contentReplyUpload(HttpSession session, @RequestBody Reply dto) {
        Account account = (Account) session.getAttribute("account");
        String key = account.getKey();

        log.info(key);

        String rtn ="1";

        dto.setUserId(key);
        log.debug(dto.getReplyId());
        log.debug(dto.getUserId());
        log.debug(dto.getContentId());
        log.debug(dto.getReply());
        if(replyService.uploadReply(dto)) rtn = "0";
        log.debug(rtn);
        return ResponseEntity.ok(rtn);
    }

    @PostMapping("contentreply/delete")
    @ResponseBody
    public ResponseEntity<String> contentReplyDelete(HttpSession session, @RequestBody Reply dto) {
        Account account = (Account) session.getAttribute("account");
        String key = account.getKey();

        log.info(key);

        String rtn ="1";

        //if(!tokenUserId.equals(dto.getUserId())) return ResponseEntity.ok(rtn);
        dto.setUserId(key);
        log.debug(dto.getUserId());
        log.debug(dto.getContentId());
        log.debug(dto.getReply());
        if(replyService.deleteReply(dto)) rtn = "0";
        log.debug(rtn);
        return ResponseEntity.ok(rtn);
    }
}
