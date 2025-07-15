package com.ultari.additional.scheduler;

import com.ultari.additional.mapper.common.AlertMapper;
import com.ultari.additional.mapper.common.SurveyMapper;
import com.ultari.additional.util.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class SchedulerService {

    @Autowired
    AlertMapper alertMapper;

    @Autowired
    SurveyMapper surveyMapper;

    @Value("${ultari.survey.expiryday:90}")
    int delDays;

    @Transactional
    @Scheduled(cron = "${ultari.scheduler.endAlert.cron:0 */5 * * * *}")
    public void endAlertCron (){
        log.debug("endAlarmCron");

        List<Map<String, String>> list = alertMapper.selectEnd30min();

        for(Map<String, String> map : list) {
            String code = map.get("code");
            String userId = map.get("userId");
            String title = map.get("title");
            String member = map.get("member");
            String inputDate = StringUtil.castNowDate(LocalDateTime.now(),"yyyyMMddHHmmss");
            alertMapper.endAlert(userId, title, code, inputDate, member, userId, "SURVEY", "0");
        }
    }

    @Transactional
    @Scheduled(cron = "${ultari.scheduler.expiresurvey.delete.cron:0 0 0 * * *}")
    public void deleteCron (){
        log.debug("deleteCron");

        LocalDate today = LocalDate.now();
        LocalDate minusDaysAgo = today.minusDays(delDays);

        String deleteDays = minusDaysAgo.toString();

        log.debug("delete days ago : {}",deleteDays);
        List<String> list = surveyMapper.findDeleteSurveyList(deleteDays);
        for(String surveyCode : list) {

            log.debug("delete surveyCode : " + surveyCode);

            surveyMapper.deleteSurvey(surveyCode);
            surveyMapper.deleteSurveyItem(surveyCode);
            surveyMapper.deleteSurveyMember(surveyCode);
            surveyMapper.deleteSurveyQuestion(surveyCode);
            surveyMapper.deleteSurveyResult(surveyCode);
            surveyMapper.deleteSurveyResultDesc(surveyCode);
        }

    }
}
