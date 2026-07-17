Mock data -- SQL
================

Folders
-------
  seed/  mock_data.php   fills the database with test data for the
                         Admission, Registrar, and Accounting (cashier) flows


Why this is a .php and not a .sql
---------------------------------
Every other seed in this project is a plain .sql file. This one can't be.
The applicant documents and the payment proofs are real files on disk --
applicant_documents.file_path and payment_proofs.file_path point at
C:/xampp/enrollment_uploads/..., outside the web root -- and the consoles open
those files. SQL can create the rows but not the files, so the "View file"
button would open a broken tab. This seeder writes both, using the same
config/db.php connection the rest of the project uses.


How to run it
-------------
From the project folder:

  "C:\Xampp download\php\php.exe" sql/seed/mock_data.php

To remove it again (only the mock rows and their files):

  "C:\Xampp download\php\php.exe" sql/seed/mock_data.php clear

Re-running it resets the mock data: it clears its own rows first, so you always
get a clean set back. Start MySQL in the XAMPP Control Panel first.


Logins it creates
-----------------
  Registrar  registrar/index.html    registrar@mock.school       Password123!
  Cashier    accounting/index.html   cashier@mock.school         Password123!
  Admin      index.html              admin@mock.school           Password123!
  Portal     student-portal/         liza.gutierrez@mock.school  Student123!


What it sets up
---------------
Nine applicants for S.Y. 2026-2027, one parked in each state worth testing:

  MOCK-2026-001  Althea Bonifacio  Pending       all documents in -- review and approve
  MOCK-2026-002  Rafael Ocampo     Pending       missing the 2x2 ID Photo -- Approve is blocked
  MOCK-2026-003  Danica Herrera    Under Review  corrections requested, Form 138 rejected
  MOCK-2026-004  Kier Mabini       Approved      no seat yet -- assign a strand and section
  MOCK-2026-005  Jasmine Reyes     Approved      no LRN -- assigning asks you to type one
  MOCK-2026-006  Liza Gutierrez    Approved      seat reserved, unpaid -- Finalize blocked
  MOCK-2026-007  Noel Villamor     Approved      partly paid (5,000) -- Finalize enabled
  MOCK-2026-008  Marites Dizon     Rejected      has a reason the applicant can read
  MOCK-2026-009  Paolo Sandoval    Enrolled      fully paid -- the finished end state

Liza also has a student-portal account and a Pending GCash proof of payment, so
the cashier's proof review has something in it. Paolo is fully paid, so he
correctly does NOT appear in the cashier's "awaiting payment" list.

Check Status (student-portal) works with any reference number above plus that
applicant's email, e.g. MOCK-2026-008 + marites.dizon@mock.school


How it stays out of your real data
----------------------------------
Everything it creates is tagged, and it only ever deletes rows matching these:

  applicants.reference_number                  LIKE 'MOCK-%'
  users / students / student_accounts .email   LIKE '%@mock.school'

Mock student numbers start at 2026-0100 and mock LRNs at 99..., so they can't
collide with real ones (both columns are UNIQUE). Your existing records are
never read or written.

One exception, and it only adds files: some document rows that were already in
the database point at uploads that aren't on this machine, which makes "View
file" 404. The seeder writes a placeholder PDF at those paths. It does not
change those rows.
