Accounting module -- SQL
========================

Folders
-------
  schema/  01_accounting_tables.sql   creates acct_fees and acct_payments
  seed/    02_fee_schedule.sql        fills acct_fees with the starting fees

Run them in number order.


How to import in XAMPP
----------------------
1. Start Apache and MySQL in the XAMPP Control Panel.
2. Open http://localhost/phpmyadmin
3. Import the main schema first if you haven't:  src/schema/schema.sql
   That is what creates the `enrollment_management_system` database.
4. Click the `enrollment_management_system` database in the left sidebar.
5. Import tab -> choose accounting/sql/schema/01_accounting_tables.sql -> Go
6. Import tab -> choose accounting/sql/seed/02_fee_schedule.sql -> Go

Or from the command line:

  cd C:\xampp\mysql\bin
  mysql -u root enrollment_management_system < ...\accounting\sql\schema\01_accounting_tables.sql
  mysql -u root enrollment_management_system < ...\accounting\sql\seed\02_fee_schedule.sql

Both files start with USE `enrollment_management_system`, so they land in the
right database either way. The connection settings the rest of the project
uses are in config/db.php (localhost, root, no password).


What this does NOT do yet
-------------------------
Importing these files does not change what the pages show. The fee amounts are
still read from the hardcoded FeeSchedule::items() in
api/Models/payment_model.php -- nothing reads acct_fees yet.

To actually make the amounts come from the database, the module still needs:
  - a DAO in api/Dao/ that SELECTs from acct_fees using config/db.php
  - FeeSchedule::items() / total() changed to call that DAO
  - the checkout to INSERT into acct_payments, then UPDATE the row to 'paid'
    once PayMongo confirms


Notes
-----
- The tables are prefixed acct_ on purpose. src/schema/schema.sql already has
  a `payments` table, but it requires an enrollment_id and this module only
  collects a typed student number, so it cannot fill that column in.
  acct_payments is the cashier's own record and leaves the existing table
  alone.
- Amounts are DECIMAL(10,2) in pesos. Never store money in a float.
  PayMongo is charged in centavos; the PHP converts (Payment::toCentavos).
- The enum values match the code: plan matches Payment::allowedPlans() and
  method matches the keys of Payment::methodMap().
- Re-running the seed updates the existing rows instead of duplicating them.
