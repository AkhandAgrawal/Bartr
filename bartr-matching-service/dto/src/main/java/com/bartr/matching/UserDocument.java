package com.bartr.matching;

import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;
import java.util.UUID;

@Document(indexName = "users_index", createIndex = true)
@SuperBuilder
@NoArgsConstructor
@Setter
@Getter
public class UserDocument {

    @Id
    @Field(type = FieldType.Keyword)
    private UUID keycloakId;

    @Field(type= FieldType.Text)
    private String firstName;

    @Field(type= FieldType.Text)
    private String lastName;

    @Field(type= FieldType.Text)
    private String gender;

    @Field(type= FieldType.Keyword)
    private String userName;

    @Field(type= FieldType.Keyword)
    private String email;

    @Field(type= FieldType.Keyword)
    private List<String> skillsOffered;

    @Field(type= FieldType.Keyword)
    private List<String> skillsWanted;

}
