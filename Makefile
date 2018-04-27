help:
	@echo "make doc => Generates the doc files use jsdoc"
	@echo "make it  => Run Integration Tests"
	@echo "make ut  => Run Unit Tests"

clean:
	rm -rf doc

doc: clean
	# jsdoc supports a -d option for destination directory. Don't use it!
	# Instead, just let it generate in ./out and then copy the contents.
	# Coz, using -d option with an existing directory barfs!!
	jsdoc  index.js README.md
	mv out doc

it:
	@echo "Starting Integration Tests"
	@mocha tests/integration
	@echo "Finished Integration Tests"

ut:
	@echo "Starting Unit Tests"
	@mocha tests/unit
	@echo "Finished Unit Tests"
