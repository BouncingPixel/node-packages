
CREATE TABLE "loginlocker" (
  "email" varchar(256) NOT NULL,
  "failedcount" int(11) NOT NULL,
  "lastAttempt" timestamp with timezone NOT NULL
);

ALTER TABLE ONLY loginlocker ADD CONSTRAINT loginlocker_pkey PRIMARY KEY (email);

# you may wish to change the type of userid to match your userids
CREATE TABLE "remembermetoken" (
  "token" varchar(128) NOT NULL,
  "userid" int(11) NOT NULL
);

ALTER TABLE ONLY remembermetoken ADD CONSTRAINT remembermetoken_pkey PRIMARY KEY (token);
