package com.ultari.additional.domain.reaction;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.json.JSONArray;
import org.json.JSONObject;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContentReactionCount {
    private String reaction0 = "0";
    private String reaction1 = "0";
    private String reaction2 = "0";
    private String reaction3 = "0";
    private String reaction4 = "0";
    private String reaction5 = "0";
    private String reaction6 = "0";
    private String reaction7 = "0";
    private String reaction8 = "0";
    private String reaction9 = "0";
    private String reaction10 = "0";
    private String reaction11 = "0";

    public JSONObject getJson() {
        JSONObject json = new JSONObject();
        json.put("0",this.reaction0);
        json.put("1",this.reaction1);
        json.put("2",this.reaction2);
        json.put("3",this.reaction3);
        json.put("4",this.reaction4);
        json.put("5",this.reaction5);
        json.put("6",this.reaction6);
        json.put("7",this.reaction7);
        json.put("8",this.reaction8);
        json.put("9",this.reaction9);
        json.put("10",this.reaction10);
        json.put("11",this.reaction11);

        return json;
    }

    public void setReactionCount(String name, String count) {
        if(name.equals("0")) this.reaction0 = count;
        else if(name.equals("1")) this.reaction1 = count;
        else if(name.equals("2")) this.reaction2 = count;
        else if(name.equals("3")) this.reaction3 = count;
        else if(name.equals("4")) this.reaction4 = count;
        else if(name.equals("5")) this.reaction5 = count;
        else if(name.equals("6")) this.reaction6 = count;
        else if(name.equals("7")) this.reaction7 = count;
        else if(name.equals("8")) this.reaction8 = count;
        else if(name.equals("9")) this.reaction9 = count;
        else if(name.equals("10")) this.reaction10 = count;
        else if(name.equals("11")) this.reaction11 = count;
    }

    public String getTotalCount() {
        int total = 0;
        JSONObject json = getJson();
        for(String key:json.keySet()) {
            int count = Integer.parseInt(String.valueOf(json.get(key)));
            total = total + count;
        }

        return String.valueOf(total);
    }

    public JSONArray getJsonArrayCount() {
        JSONArray arr = new JSONArray();
        JSONObject json = getJson();

        for(String key:json.keySet()){
            JSONObject _json = new JSONObject();
            _json.put("name",key);
            _json.put("count",json.get(key));
            arr.put(_json);
        }

        return arr;
    }
}
