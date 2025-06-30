package com.ultari.additional.mapper.common;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface AlertMapper {
    public void registAlert(@Param("userId") String userId, @Param("title") String title, @Param("url") String url, @Param("inputDate") String inputDate, @Param("recvId") String recvId, @Param("sndUser") String sndUser, @Param("sysName") String sysName, @Param("alertType") String AlertType);
    public void endAlert(@Param("userId") String userId, @Param("title") String title, @Param("url") String url, @Param("inputDate") String inputDate, @Param("recvId") String recvId, @Param("sndUser") String sndUser, @Param("sysName") String sysName, @Param("alertType") String AlertType);

    List<Map<String, String>> selectEnd30min();
}
