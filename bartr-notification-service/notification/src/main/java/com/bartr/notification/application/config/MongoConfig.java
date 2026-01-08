package com.bartr.notification.application.config;

import org.apache.avro.generic.GenericRecord;
import org.apache.avro.util.Utf8;
import org.bson.Document;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class MongoConfig {

    @Bean
    public MongoCustomConversions customConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();
        converters.add(new DocumentToMapConverter());
        return new MongoCustomConversions(converters);
    }

    /**
     * Converts MongoDB Document (which may contain GenericRecord data) to Map when reading
     * This handles both old notifications with GenericRecord and new ones with plain Maps
     */
    @ReadingConverter
    static class DocumentToMapConverter implements Converter<Document, Map<String, Object>> {
        @Override
        public Map<String, Object> convert(Document source) {
            if (source == null) {
                return null;
            }
            Map<String, Object> result = new HashMap<>();
            for (String key : source.keySet()) {
                Object value = source.get(key);
                // Skip MongoDB internal fields
                if (key.equals("_class")) {
                    continue;
                }
                result.put(key, convertValue(value));
            }
            return result;
        }
        
        private Object convertValue(Object value) {
            if (value == null) {
                return null;
            }
            
            // Handle MongoDB Document (nested objects)
            if (value instanceof Document) {
                Map<String, Object> result = new HashMap<>();
                Document doc = (Document) value;
                for (String key : doc.keySet()) {
                    if (!key.equals("_class")) {
                        result.put(key, convertValue(doc.get(key)));
                    }
                }
                return result;
            }
            
            // Handle GenericRecord (from old notifications)
            if (value instanceof GenericRecord) {
                return convertGenericRecordToMap((GenericRecord) value);
            }
            
            // Handle Utf8 (Avro string type)
            if (value instanceof Utf8) {
                return value.toString();
            }
            
            // Handle CharSequence (convert to String)
            if (value instanceof CharSequence) {
                return value.toString();
            }
            
            // Handle nested Maps
            if (value instanceof Map) {
                Map<String, Object> result = new HashMap<>();
                for (Object key : ((Map<?, ?>) value).keySet()) {
                    result.put(key.toString(), convertValue(((Map<?, ?>) value).get(key)));
                }
                return result;
            }
            
            // Handle Lists
            if (value instanceof List) {
                List<Object> result = new ArrayList<>();
                for (Object item : (List<?>) value) {
                    result.add(convertValue(item));
                }
                return result;
            }
            
            // Return as-is for primitives and other types
            return value;
        }
        
        private Map<String, Object> convertGenericRecordToMap(GenericRecord record) {
            Map<String, Object> map = new HashMap<>();
            if (record != null) {
                for (org.apache.avro.Schema.Field field : record.getSchema().getFields()) {
                    Object value = record.get(field.name());
                    map.put(field.name(), convertValue(value));
                }
            }
            return map;
        }
    }
}

