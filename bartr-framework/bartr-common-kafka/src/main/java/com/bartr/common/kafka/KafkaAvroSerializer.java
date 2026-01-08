package com.bartr.common.kafka;

import org.apache.avro.io.Encoder;
import org.apache.avro.io.EncoderFactory;
import org.apache.avro.specific.SpecificDatumWriter;
import org.apache.avro.specific.SpecificRecord;
import org.apache.kafka.common.serialization.Serializer;

import java.io.ByteArrayOutputStream;
import java.util.Map;

public class KafkaAvroSerializer<T extends SpecificRecord> implements Serializer<T> {

    @Override
    public void configure(Map<String, ?> configs, boolean isKey) {
    }

    @Override
    public byte[] serialize(String topic, T data) {
        if (data == null) return null;
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            SpecificDatumWriter<T> datumWriter = new SpecificDatumWriter<>(data.getSchema());
            Encoder encoder = EncoderFactory.get().binaryEncoder(outputStream, null);
            datumWriter.write(data, encoder);
            encoder.flush();
            return outputStream.toByteArray();
        } catch (Exception e) {
            // Runtime exceptions in serializers are expected to be handled by Kafka framework
            throw new RuntimeException("Error serializing Avro message", e);
        }
    }

    @Override
    public void close() {
    }
}

