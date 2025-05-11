# Data Model

## Person

* Description: Details of a passenger or crew member that travelled on the City of Adelaide ship
* Primary Key: ID
* Columns:

| Column Name  | Type | Description                                                  | Required |
| ------------ | ---- | ------------------------------------------------------------ | -------- |
| ID           | UUID | System generated unique ID for the person                    | Yes      |
| first_name   | TEXT | First name of the person                                     | Yes      |
| middle_names | TEXT | Middle name of the person                                    |          |
| last_name    | TEXT | Last name of the person                                      | Yes      |
| gender       | TEXT | Gender of the person, can be Male, Female or Null if unknown |          |
| birth_date   | DATE | Date the person was born                                     |          |
| birth_place  | TEXT | Place of birth for the person                                |          |
| death_date   | DATE | Date the person died                                         |          |
| death_place  | TEXT | Location the person died                                     |          |
| age_at_death | TEXT | Age of the person at death                                   |          |
| burial_place | TEXT | Place the person was buried.                                 |          |
