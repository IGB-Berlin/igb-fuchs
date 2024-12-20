#!/usr/bin/env perl
use warnings;
use strict;

my $PAT = qr/\$\s*Commit(?:\:\s+[a-fA-F0-9]+)?\s*\$/;
my $CMD = shift;
die "Usage: $0 smudge|clean\n" unless $CMD && ( $CMD eq 'smudge' || $CMD eq 'clean' );
if ($CMD eq 'smudge') {
  chomp( my $commit = `git rev-parse --short HEAD` );
  die "Bad commit '$commit'" unless $commit=~/\A[a-fA-F0-9]{4,}\z/;
  while (<>) {
    s{$PAT}{\$ Commit: $commit \$}g;
    print;
  }
}
elsif ($CMD eq 'clean') {
  while (<>) {
    s{$PAT}{\$Commit\$}g;
    print;
  }
}
