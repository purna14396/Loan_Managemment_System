package com.loanmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoanTypeActiveCountDto {
    private Long loanTypeId;
    private String loanTypeName;
    private Integer count;
}
