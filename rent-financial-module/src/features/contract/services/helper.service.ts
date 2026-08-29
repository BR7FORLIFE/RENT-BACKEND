import { CallModelStream } from '../../../core/IA/IA-cclient.js';

interface ContractingParties {
  signingPartiesName: string; //nombre de la persona que hace parte en el acuerdo
  signingPartiesIdentificationNumber: string; //numero de identificacion de la persona parte del acuerdo
  signingPartiesIdentificationType: 'CC' | 'CE' | 'TI' | 'PPT' | 'PASSPORT';
}

interface ContractPropertyInfo {
  propertyName: string;
  propertyPredialNumber: string;
  propertyFmi: string;
}

interface ContractFinancialProperty {
  montlyRent: number;
  currency: 'USD' | 'COP';
}

interface ContractDuration {
  startDate: Date;
  endDate: Date;
}

export interface GenerateIAContractFields {
  contractingParties: ContractingParties[];
  contractPropertyInfo: ContractPropertyInfo;
  contractFinancial: ContractFinancialProperty;
  contractDuration: ContractDuration;
}

export async function generateIAContentContract(
  data: GenerateIAContractFields,
) {
  const STRUCTURE_PROMPT = `
You are an AI assistant specialized in drafting residential lease agreements for urban properties in Colombia.

Your task is to generate a formal, clear, and legally coherent residential lease agreement based exclusively on the information provided below.

The agreement must comply with the applicable Colombian legal framework for urban residential leases, especially Law 820 of 2003 and the applicable general provisions of the Colombian Civil Code.

IMPORTANT RULES:

- Do not invent personal information, identification numbers, property information, dates, prices, currencies, or any other factual information.
- Do not modify any value provided in the input.
- Do not invent Colombian laws, legal articles, penalties, indemnities, rights, obligations, procedures, or legal requirements.
- Do not cite specific legal articles.
- Do not create provisions that contradict Colombian law.
- Do not include public utilities or utility payment clauses because this information is not provided.
- If information is missing, use "[NOT PROVIDED]".
- The final contract must be written entirely in formal Spanish.
- Do not provide explanations, analysis, comments, or disclaimers.
- Output only the final residential lease agreement.

# CONTRACT INFORMATION

## CONTRACTING PARTIES

${data.contractingParties
  .map(
    (party, index) => `
Party ${index + 1}:
- Name: ${party.signingPartiesName}
- Identification Type: ${party.signingPartiesIdentificationType}
- Identification Number: ${party.signingPartiesIdentificationNumber}
`,
  )
  .join('')}

## PROPERTY INFORMATION

- Property Name: ${data.contractPropertyInfo.propertyName}
- Property Tax Number: ${data.contractPropertyInfo.propertyPredialNumber}
- FMI: ${data.contractPropertyInfo.propertyFmi}

## FINANCIAL INFORMATION

- Monthly Rent: ${data.contractFinancial.montlyRent}
- Currency: ${data.contractFinancial.currency}

## CONTRACT DURATION

- Start Date: ${data.contractDuration.startDate.toISOString().split('T')[0]}
- End Date: ${data.contractDuration.endDate.toISOString().split('T')[0]}

# REQUIRED CONTRACT STRUCTURE

Generate the contract using the following structure:

1. CONTRATO DE ARRENDAMIENTO DE VIVIENDA URBANA

2. IDENTIFICACIÓN DE LAS PARTES

Identify every contracting party using the information provided.

3. IDENTIFICACIÓN DEL INMUEBLE

Include:
- Property name
- Número Predial
- Folio de Matrícula Inmobiliaria (FMI)

4. OBJETO DEL CONTRATO

Describe the lease of the identified urban residential property.

5. DESTINACIÓN DEL INMUEBLE

State that the property is intended for residential use.

6. DURACIÓN DEL CONTRATO

Include:
- Start date
- End date
- Contract duration

7. CANON DE ARRENDAMIENTO

Include:
- Monthly rent
- Currency

Do not invent payment dates or payment methods.

8. REAJUSTE DEL CANON

Include a general clause stating that rent adjustments must comply with the applicable Colombian legal framework.

Do not invent percentages or formulas.

9. OBLIGACIONES DE LAS PARTES

Include the legally applicable obligations of the landlord and tenant.

Do not invent additional obligations.

10. CONSERVACIÓN Y REPARACIONES

Include general provisions regarding proper use, preservation, damage, and repairs according to the applicable Colombian legal framework.

11. SUBARRIENDO Y CESIÓN

Include the applicable Colombian rules regarding subleasing and assignment.

12. TERMINACIÓN DEL CONTRATO

Include general provisions regarding legally applicable termination mechanisms.

Do not invent notice periods, penalties, or indemnity amounts.

13. PRÓRROGA

Include the applicable Colombian rules regarding extension or renewal.

14. RESTITUCIÓN DEL INMUEBLE

Include the obligation to return the property when the lease is legally terminated.

15. NOTIFICACIONES

Include a general notifications clause.

Do not invent contact information.

16. LEGISLACIÓN APLICABLE Y SOLUCIÓN DE CONTROVERSIAS

State that the agreement is governed by applicable Colombian law.

17. ACEPTACIÓN Y FIRMAS

Provide a signature section for every contracting party.

For each party include:

Name:
Identification:
Signature:
Date:

# FINAL VALIDATION

Before generating the contract, verify that:

- Every contracting party is included.
- No party has been invented.
- Property information exactly matches the provided data.
- Financial information exactly matches the provided data.
- Dates exactly match the provided data.
- No public utility clauses are included.
- No information has been invented.
- The entire contract is written in Spanish.
- The output contains only the contract.

Generate the final residential lease agreement now.
`;

  return await CallModelStream(STRUCTURE_PROMPT);
}
