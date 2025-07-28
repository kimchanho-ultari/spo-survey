package com.ultari.additional.controller;

import com.ultari.additional.domain.account.Account;
import com.ultari.additional.domain.reaction.ContentReaction;
import com.ultari.additional.service.ReactionService;
import lombok.extern.slf4j.Slf4j;
import javax.naming.AuthenticationException;
import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;

@Slf4j
@Controller
public class ReactionController {
    @Autowired
    ReactionService reactionService;

    @PostMapping("contentreaction")
    @ResponseBody
    public String contentreaction(HttpSession session, @RequestParam("contentId") String contentId) {
        log.debug(contentId);
        Account account = (Account) session.getAttribute("account");
        String key = account.getKey();

        log.info(key);

        try{
            log.debug(key);
            if (key == null) throw new AuthenticationException("INVALID");
            JSONArray arr = reactionService.getContentReaction(contentId);
            log.debug(arr.toString());
            return arr.toString();
        } catch (Exception ae){
            log.error("",ae);
            return "not";
        }
    }

    @PostMapping("contentreaction/{key}/list")
    @ResponseBody
    public String contentreactionByKey(HttpSession session, @PathVariable("key") String reactionKey, @RequestParam("contentId") String contentId) {
        log.debug(contentId);

        Account account = (Account) session.getAttribute("account");
        String key = account.getKey();

        log.info(key);

        try{
            log.debug(key);
            if (key == null) throw new AuthenticationException("INVALID");

            JSONArray arr = new JSONArray();

            if(reactionKey.equals("total")) arr = reactionService.getContentReactionTotalList(contentId, reactionKey);
            else arr = reactionService.getContentReactionList(contentId, reactionKey);
            log.debug(arr.toString());
            return arr.toString();
        } catch (Exception ae){
            log.error("",ae);
            return "not";
        }
    }

    @PostMapping("contentreaction/upload")
    @ResponseBody
    public ResponseEntity<String> contentreactionUpload(HttpSession session, @RequestBody ContentReaction reaction) {
        log.debug(reaction.toString());
        String result = "TRUE";
        Account account = (Account) session.getAttribute("account");
        String key = account.getKey();

        log.info(key);
        try{
            log.debug(key);
            if (key == null) throw new AuthenticationException("INVALID");

            if(reaction.getReaction().equals("remove")) reactionService.removeReaction(reaction);
            else reactionService.saveReaction(reaction);
        } catch (Exception ae){
            log.error("",ae);
            result = "FAIL";
        }
        return ResponseEntity.ok(result);
    }
}
