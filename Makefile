#
# Build script for the-law-factory
#
# "make" will create the following files:
#   - public/built/main.js - concatenated scripts
#   - public/built/main.css - concatenated stylesheets
#   - public/index.built.html - index that uses the above instead of linking to multiple files
#
#   Also note that if no public/config.js file exists when calling "make", it will be copied
#   from public/config.js.example.
#
# "make clean" will remove what "make" created.
#
# "make install" will put everything needed in a "prod" directory alongside "public" and
# replace the index inside by the built version.
#

SRCDIR := public
BUILTDIR := $(SRCDIR)/built
INSTALLDIR := prod
SRCINDEX := $(SRCDIR)/index.html
BUILTINDEX := $(SRCDIR)/index.built.html
IBUILTINDEX := $(patsubst $(SRCDIR)/%,$(INSTALLDIR)/%,$(BUILTINDEX))
BUILTCSS := $(BUILTDIR)/main.css
BUILTJS := $(BUILTDIR)/main.js

ALLCSS := $(shell find $(SRCDIR) -name *.css)
ALLJS := $(shell find $(SRCDIR) -name *.js)

all: $(BUILTINDEX) $(BUILTJS) $(BUILTCSS)
install: $(INSTALLDIR) $(INSTALLDIR)/index.html

include Depends.mk

# Create depends by extracting references to css/js files from index
Depends.mk: $(SRCINDEX) $(ALLCSS) $(ALLJS)
	grep '<script type="text/javascript" src' $(SRCINDEX) | sed -r 's;.*src="([^"]+)".*;$(BUILTJS): $(SRCDIR)/\1;' > Depends.mk
	grep '<link rel="stylesheet" href' $(SRCINDEX) | sed -r 's;.*href="([^"]+)".*;$(BUILTCSS): $(SRCDIR)/\1;' >> Depends.mk

$(BUILTINDEX): $(SRCINDEX)
	cat $< \
	| sed -r '0,/(<script type="text\/javascript" src[^>]+><\/script>)/s//<script src="$(subst /,\/,$(patsubst $(SRCDIR)/%,%,$(BUILTJS)))"><\/script>\n\1/' \
	| sed -r '0,/(<link rel="stylesheet" href[^>]+>)/s//<link href="$(subst /,\/,$(patsubst $(SRCDIR)/%,%,$(BUILTCSS)))" rel="stylesheet">\n\1/' \
	| sed -r 's/(<script type="text\/javascript" src[^>]+><\/script>)/<!-- \1 -->/' \
	| sed -r 's/(<link rel="stylesheet" href[^>]+>)/<!-- \1 -->/' \
	> $@

# Copy config.js.example if config.js does net exist
$(SRCDIR)/config.js: $(SRCDIR)/config.js.example
	[ ! -f $@ ] && cp $^ $@ || true
	touch $@

$(BUILTJS):
	mkdir -p $$(dirname $@)
	cat $^ | sed -r 's/# sourceMappingURL=[^ ]+\.map//g' > $@

$(BUILTCSS):
	mkdir -p $$(dirname $@)
	cat $^ > $@

.PHONY: clean
clean:
	rm -f Depends.mk $(BUILTINDEX) $(BUILTJS) $(BUILTCSS)
	[ -d $(BUILTDIR) ] && rmdir $(BUILTDIR) || true

.PHONY: $(INSTALLDIR)
$(INSTALLDIR):
	[ -d $(INSTALLDIR) ] && rm -r $(INSTALLDIR) || true
	cp -R $(SRCDIR) $(INSTALLDIR)

.PHONY: $(INSTALLDIR)/index.html
$(INSTALLDIR)/index.html: $(INSTALLDIR)
	[ -f $@ ] && rm $@ || true
	mv $(IBUILTINDEX) $@
