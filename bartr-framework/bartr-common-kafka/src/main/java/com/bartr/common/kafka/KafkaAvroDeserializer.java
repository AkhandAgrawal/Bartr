package com.bartr.common.kafka;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericRecord;
import org.apache.avro.io.BinaryDecoder;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.specific.SpecificDatumReader;
import org.apache.kafka.common.serialization.Deserializer;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Map;

public class KafkaAvroDeserializer<T> implements Deserializer<T> {
    private Schema schema;
    private Schema matchSchema;
    private Schema messageSchema;
    private boolean useGenericRecord = false;

    public KafkaAvroDeserializer() {
    }

    @Override
    public void configure(Map<String, ?> configs, boolean isKey) {
        
        // Check if we should use GenericRecord instead of SpecificRecord
        if (configs.containsKey("custom.avro.use.generic.record")) {
            useGenericRecord = Boolean.parseBoolean(configs.get("custom.avro.use.generic.record").toString());
        }
        
        // Load all available schemas
        if (configs.containsKey("custom.avro.match.schema")) {
            String matchSchemaString = (String) configs.get("custom.avro.match.schema");
            this.matchSchema = new Schema.Parser().parse(matchSchemaString);
        }
        
        if (configs.containsKey("custom.avro.message.schema")) {
            String messageSchemaString = (String) configs.get("custom.avro.message.schema");
            this.messageSchema = new Schema.Parser().parse(messageSchemaString);
        }
        
        // Fallback to single schema if topic-specific schemas not available
        if (configs.containsKey("custom.avro.schema")) {
            String schemaString = (String) configs.get("custom.avro.schema");
            this.schema = new Schema.Parser().parse(schemaString);
        }
        
        // If no schemas loaded, throw error
        if (schema == null && matchSchema == null && messageSchema == null) {
            throw new IllegalStateException("The schema bean is not initialized. Expected one of: custom.avro.schema, custom.avro.match.schema, custom.avro.message.schema");
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public T deserialize(String topic, byte[] data) {
        if (data == null) {
            return null;
        }
        try {
            // Determine which schema to use based on topic name
            Schema schemaToUse = this.schema;
            if (topic != null) {
                if (topic.contains("match") || "matched_topic".equals(topic)) {
                    schemaToUse = matchSchema != null ? matchSchema : schema;
                } else if (topic.contains("message") || "message_topic".equals(topic)) {
                    schemaToUse = messageSchema != null ? messageSchema : schema;
                }
            }
            
            if (schemaToUse == null) {
                throw new RuntimeException("No schema found for topic: " + topic);
            }
            
            ByteArrayInputStream inputStream = new ByteArrayInputStream(data);
            BinaryDecoder decoder = DecoderFactory.get().binaryDecoder(inputStream, null);
            
            if (useGenericRecord) {
                // Use GenericDatumReader for GenericRecord
                GenericDatumReader<GenericRecord> datumReader = new GenericDatumReader<>(schemaToUse);
                return (T) datumReader.read(null, decoder);
            } else {
                // Use SpecificDatumReader for specific Avro classes
                SpecificDatumReader<T> datumReader = new SpecificDatumReader<>(schemaToUse);
                return datumReader.read(null, decoder);
            }
        } catch (IOException e) {
            // Runtime exceptions in deserializers are expected to be handled by Kafka framework
            throw new RuntimeException("Failed to deserialize Avro data for topic: " + topic, e);
        }
    }

    @Override
    public void close() {
    }
}

