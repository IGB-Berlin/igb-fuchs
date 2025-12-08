#!/usr/bin/env perl
use 5.036;
use Text::Wrap qw/wrap/;
use Mojo::DOM;
use Mojo::File qw/curfile/;
use Mojo::UserAgent;

# This generates the `licenses.txt` from the project list in `src/index.html`.
# Requires a modern Perl and Mojolicious.

my $ua = Mojo::UserAgent->new(max_redirects => 10);
my $dom = Mojo::DOM->new( curfile->dirname->sibling('src','index.html')->slurp('UTF-8') );
my $out = curfile->dirname->sibling('licenses.txt');
$Text::Wrap::columns=80;

my $fh = $out->open('>:raw:encoding(UTF-8)');
say {$fh} "\nThis file contains the licenses for the libraries used in this project.\n",
  "\n##########", (" ##########" x 7);
$dom->find('#licensesList li')->each(sub {
  my $as = $_->find('a');
  die $_ unless $as->size==2;
  my $url = $as->[1]{'href'};
  say {$fh} "\n*** ",$as->[0]->all_text," ***\n* ",$as->[0]{'href'},"\n* ",$url."\n";
  $url =~ s#/blob/#/raw/#;
  say $url;
  my $license = $ua->get($url)->result->text;
  $license =~ s/^\s+|\s+$//g;
  $license = wrap('','',$license) if $license=~/^.{88,}$/m;
  say {$fh} $license, "\n\n##########", (" ##########" x 7);
});
close $fh;
