help:
	@echo "make doc => Generates the doc files use jsdoc"

clean:
	rm -rf doc

doc: clean
	# jsdoc supports a -d option for destination directory. Don't use it!
	# Instead, just let it generate in ./out and then copy the contents.
	# Coz, using -d option with an existing directory barfs!!
	jsdoc  index.js README.md
	mv out doc
