set @LowerPlayerLimit = 1;
set @UpperPlayerLimit = 50000;

set @LowerMatchLimit = 1;
set @UpperMatchLimit = 100000;

set @LowerRatingLimit = 1200;
set @UpperRatingLimit = 2800;

set @LowerRDLimit = 30;
set @UpperRDLimit = 350;

drop database if exists `50kp100km`;
create database if not exists `50kp100km`;

use `50kp100km`;

drop table if exists `players`;
create table if not exists `players` (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    rating FLOAT NULL,
    rd FLOAT NULL,
    sigma FLOAT NULL
);

drop table if exists `matches`;
create table if not exists `matches` (
	id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    player1 INT NULL,
    player2 INT NULL,
    score FLOAT NULL
);

drop procedure if exists seedPlayers;
drop procedure if exists seedMatches;

DELIMITER //
create procedure seedPlayers()
begin
	set @pCount = @LowerPlayerLimit;
	while (@pCount <= @UpperPlayerLimit) do
		set @rating = round(((@UpperRatingLimit - @LowerRatingLimit) * rand()) + @LowerRatingLimit, 0);
		set @rd = round(((@UpperRDLimit - @LowerRDLimit) * rand()) + @LowerRDLimit, 0);
		insert into `players` (rating, rd, sigma) values (@rating, @rd, 0.06);
		set @pCount = @pCount + 1;
	end while;
end //

create procedure seedMatches()
begin
	set @pCount = @LowerMatchLimit;
	while (@pCount <= @UpperMatchLimit) do
		set @player1 = round(((@UpperPlayerLimit - @LowerPlayerLimit) * rand()) + @LowerPlayerLimit, 0);
		set @player2 = round(((@UpperPlayerLimit - @LowerPlayerLimit) * rand()) + @LowerPlayerLimit, 0);
		insert into `matches` (player1, player2, score) values (@player1, @player2, 1.0);
		set @pCount = @pCount + 1;
	end while;
end //

create procedure seed()
begin
	call seedPlayers(); 
	call seedMatches(); 
end //

call seed();