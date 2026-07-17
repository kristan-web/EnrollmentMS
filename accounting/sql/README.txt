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


What this does
--------------
The amounts on the pages come from `acct_fees`. Edit a row and every screen
that prices an enrollment follows on the next load:

  acct_fees  ->  api/Dao/AcctFeeDAO.php  ->  FeeSchedule (api/Models/payment_model.php)
                                                |
        +---------------------------------------+----------------------+
        |                        |                                     |
  student SOA + checkout   cashier assessment / balance      registrar payment gate
  (accounting/views/)      (Controllers/cashier/)            (Controllers/registrar/)

Fees are per term. Rows are keyed on (code, school_year, semester), and each
caller prices against the term it is actually working on -- the cashier uses
the student's own enrollment term, not a single global figure. A caller that
names no term gets the school year marked active in `school_years`.

If `acct_fees` has no active rows for a term, FeeSchedule falls back to the
built-in list in api/Models/payment_model.php. That keeps a database that never
imported these files working exactly as before, and stops an empty table from
pricing an enrollment at 0.00 -- which the cashier would read as "fully paid"
and the registrar would happily finalize for free.

Online payment attempts are written to `acct_payments` by
api/Dao/AcctPaymentDAO.php: a 'pending' row when the PayMongo checkout link is
created, settled to 'paid' / 'failed' / 'expired' / 'cancelled' when
?action=status asks PayMongo how it went. PayMongo is the authority; a row
already marked 'paid' is never rewritten. Failing to log an attempt never
blocks a student from paying.

Still hardcoded, on purpose
---------------------------
accounting/models/accounting-model.js keeps FALLBACK_FEES. It is only rendered
when the browser cannot reach the server -- the pages normally fetch the real
amounts from ?action=fees. If you change the fees in the database, that list
will read stale in that offline case; it is display-only and no payment is ever
priced from it.


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
