package com.ultari.additional.util;

import java.lang.reflect.Method;

public class Reflection {

	private Class<?> cls = null;
	private Object constructor = null;
	private Method method = null;
	
	private boolean isStatic = false;
	
	public static void main(String[] args) {
		
		Reflection ref = null;
		
		//String className = "com.ultari.noti.utils.MethodNonStatic";
		//String methodName = "test";
		
		String className = "com.ultari.noti.utils.MethodStatic";
		String methodName = "test";
		
		//String str = "injection construct parameter";
		String str2 = "method parameter";
		
		//Object[] constParam = new Object[] {str};
		Object[] methodParameter = new Object[] {str2};
		
		try {
			//ref = new Reflection(className, false);
			//ref.invoke(methodName);
			
			//ref = new Reflection(className, false);
			//ref.invoke(methodName, methodParameter);
			
			//ref = new Reflection(className, constParam, false);
			//ref.invoke(methodName);
			
			//ref = new Reflection(className, constParam, false);
			//ref.invoke(methodName, methodParameter);
			
			//ref = new Reflection(className, true);
			//ref.invoke(methodName);
			
			ref = new Reflection(className, true);
			ref.invoke(methodName, methodParameter);
		} catch(Exception e) {
			e.printStackTrace();
		}
	}
	
	public Reflection(String className, boolean isStatic) throws Exception {
		this.isStatic = isStatic;
		setClass(className, null);
	}
	
	public Reflection(String className, Object[] constParam, boolean isStatic) throws Exception {
		this.isStatic = isStatic;
		setClass(className, constParam);
	}
	
	private void setClass(String className, Object[] constParam) throws Exception {
		try {
			cls = Class.forName(className.trim());
			if (constParam != null) {
				Class<?>[] parameterType = new Class[constParam.length];
				
				for (int i = 0; i < constParam.length; i++) {
					parameterType[i] = constParam[i].getClass();
				}
				constructor = cls.getConstructor(parameterType).newInstance(constParam);
			} else {
				constructor = cls.getConstructor().newInstance();
			}
		} catch(Exception e) {
			throw e;
		}
	}
	
	public Object invoke(String methodName) throws Exception {
		method = cls.getMethod(methodName);
		return method.invoke(constructor);
	}
	
	public Object invoke(String methodName, Object[] param) throws Exception {
		Object obj = null;
		if (param != null) {
			Class<?>[] parameterTypes = new Class[param.length];
			
			for (int i = 0; i < param.length; i++) {
				parameterTypes[i] = param[i].getClass();
			}
			
			if (method == null) {
				method = cls.getMethod(methodName, parameterTypes);
			} 
			
			if (isStatic) {
				obj = method.invoke(null, param);
			} else {
				obj = method.invoke(constructor, param);
			}
		} else {
			if (method == null) {
				method = cls.getMethod(methodName);
			}
			
			if (isStatic) {
				obj = method.invoke(null);
			} else {
				obj = method.invoke(constructor);
			}
		}
		
		return obj;
	}
}