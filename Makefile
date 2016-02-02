#
# Build script for the-law-factory
#
# "make" will create the following files:
#   - public/prod/main.js - concatenated scripts
#   - public/prod/main.css - concatenated stylesheets
#   - public/index.prod.html - index that uses the above instead of linking to multiple files
#
#   It will also make index.prod.html the "active" index by linking index.html to it.
#   Also note that if no public/config.js file exists when calling "make", it will be copied
#   from public/config.js.example.
#
# "make clean" will remove what "make" created and make public/index.dev.html active again.
#

DOCROOT := public
BUILTDIR := prod

DEVINDEX := $(DOCROOT)/index.dev.html
ALLCSS := $(wildcard $(DOCROOT)/css/*.css) $(wildcard $(DOCROOT)/fonts/*.css)
ALLJS := $(wildcard $(DOCROOT)/*.js) $(wildcard $(DOCROOT)/lib/*.js) $(wildcard $(DOCROOT)/modules/*/*.js)

PRODINDEX := $(DOCROOT)/index.prod.html
PRODJS := $(DOCROOT)/$(BUILTDIR)/main.js
PRODCSS := $(DOCROOT)/$(BUILTDIR)/main.css

INDEXLINK := $(DOCROOT)/index.html

all: $(PRODINDEX) $(PRODJS) $(PRODCSS) link-prod

include Depends.mk

Depends.mk: $(DEVINDEX) $(ALLCSS) $(ALLJS)
	grep '<script type="text/javascript" src' $(DEVINDEX) | sed -r 's;.*src="([^"]+)".*;$(PRODINDEX): $(DOCROOT)/\1;' > Depends.mk
	grep '<script type="text/javascript" src' $(DEVINDEX) | sed -r 's;.*src="([^"]+)".*;$(PRODJS): $(DOCROOT)/\1;' >> Depends.mk
	grep '<link rel="stylesheet" href' $(DEVINDEX) | sed -r 's;.*href="([^"]+)".*;$(PRODINDEX): $(DOCROOT)/\1;' >> Depends.mk
	grep '<link rel="stylesheet" href' $(DEVINDEX) | sed -r 's;.*href="([^"]+)".*;$(PRODCSS): $(DOCROOT)/\1;' >> Depends.mk

$(PRODINDEX): $(DEVINDEX)
	cat $< \
	| sed -r '0,/(<script type="text\/javascript" src[^>]+><\/script>)/s//<script src="$(BUILTDIR)\/main.js"><\/script>\n\1/' \
	| sed -r '0,/(<link rel="stylesheet" href[^>]+>)/s//<link href="$(BUILTDIR)\/main.css" rel="stylesheet">\n\1/' \
	| sed -r 's/(<script type="text\/javascript" src[^>]+><\/script>)/<!-- \1 -->/' \
	| sed -r 's/(<link rel="stylesheet" href[^>]+>)/<!-- \1 -->/' \
	> $@

# Copy config.js.example if config.js does net exist
$(DOCROOT)/config.js: $(DOCROOT)/config.js.example
	[ ! -f $@ ] && cp $^ $@ || true
	touch $@

$(PRODJS):
	mkdir -p $$(dirname $@)
	cat $^ | sed -r 's/# sourceMappingURL=[^ ]+\.map//g' > $@

$(PRODCSS):
	mkdir -p $$(dirname $@)
	cat $^ > $@

@PHONY: link-prod
link-prod: $(PRODINDEX)
	[ -L $(INDEXLINK) ] && rm $(INDEXLINK) || true
	ln -s $$(basename $(PRODINDEX)) $(INDEXLINK)

@PHONY: link-dev
link-dev:
	[ -L $(INDEXLINK) ] && rm $(INDEXLINK) || true
	ln -s $$(basename $(DEVINDEX)) $(INDEXLINK)

@PHONY: clean
clean: link-dev
	rm -f Depends.mk $(PRODINDEX) $(PRODJS) $(PRODCSS)
	[ -d $(DOCROOT)/$(BUILTDIR) ] && rmdir $(DOCROOT)/$(BUILTDIR) || true
