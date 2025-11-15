/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'This dependency is part of a circular relationship. You might want to revise ' +
        'your solution (e.g. use dependency inversion, make sure the modules have a single responsibility) ',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      comment:
        "This is an orphan module - it's likely unused. Either use it or remove it. If it's " +
        "logical this module is an orphan (i.e. it's a config file), add an exception for it.",
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(?:js|cjs|mjs|ts|json)$', // dot files
          '\\.d\\.ts$', // TypeScript declaration files
          '(^|/)(?:test|spec)s?/', // test directories
          '\\.(test|spec)\\.(js|mjs|cjs|ts|ls|coffee|litcoffee|coffee\\.md)$', // test files
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      comment:
        'A module depends on a node core module that has been deprecated. Find an alternative - these are ' +
        "bound to exist - node doesn't deprecate lightly.",
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^(v8/tools/codemap)$',
          '^(v8/tools/consarray)$',
          '^(v8/tools/csvparser)$',
          '^(v8/tools/logreader)$',
          '^(v8/tools/profile_view)$',
          '^(v8/tools/profile)$',
          '^(v8/tools/SourceMap)$',
          '^(v8/tools/splaytree)$',
          '^(v8/tools/tickprocessor-driver)$',
          '^(v8/tools/tickprocessor)$',
          '^(node-inspect/lib/_inspect)$',
          '^(node-inspect/lib/internal/inspect_client)$',
          '^(node-inspect/lib/internal/inspect_repl)$',
          '^(async_hooks)$',
          '^(punycode)$',
          '^(domain)$',
          '^(constants)$',
          '^(sys)$',
          '^(_linklist)$',
          '^(_stream_wrap)$',
        ],
      },
    },
    {
      name: 'not-to-deprecated',
      comment:
        'This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later ' +
        'version of that module, or find an alternative. Deprecated modules are a security risk.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['deprecated'],
      },
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment:
        "This module depends on an npm package that isn't in the 'dependencies' section of your package.json. " +
        "That's problematic as the package either (1) won't be available on live (2) will be available on live with an " +
        'unpredictable version. Fix it by adding the package to the dependencies in your package.json.',
      from: {},
      to: {
        dependencyTypes: ['npm-no-pkg', 'npm-unknown'],
      },
    },
    {
      name: 'not-to-unresolvable',
      comment:
        "This module depends on a module that cannot be found ('resolved to disk'). If it's an npm " +
        'module: add it to your package.json. In all other cases you likely already know what to do.',
      severity: 'error',
      from: {},
      to: {
        couldNotResolve: true,
      },
    },
    {
      name: 'no-duplicate-dep-types',
      comment:
        "Likely this module depends on an external ('npm') package that occurs more than once " +
        'in your package.json i.e. both as a devDependencies and in dependencies. This will cause ' +
        'maintenance problems later on.',
      severity: 'warn',
      from: {},
      to: {
        moreThanOneDependencyType: true,
        // as it's pretty common to have a type import be a type only import
        // _and_ (e.g.) a devDependency - don't consider type-only dependency
        // types for this rule
        dependencyTypesNot: ['type-only'],
      },
    },

    /* rules you might want to tweak for your specific situation: */

    {
      name: 'not-to-spec',
      comment:
        'This module depends on a spec (test) file. The sole responsibility of a spec file is to test code. ' +
        "If there's something in a spec that's of use to other modules, it doesn't have that single " +
        'responsibility anymore. Factor it out into (e.g.) a separate utility/ helper or a mock.',
      severity: 'error',
      from: {
        pathNot: '\\.(test|spec)\\.(js|mjs|cjs|ts)$',
      },
      to: {
        path: '\\.(test|spec)\\.(js|mjs|cjs|ts)$',
      },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment:
        "This module depends on an npm package from the 'devDependencies' section of your " +
        'package.json. It looks like something that ships to production, though. To prevent problems ' +
        "with npm packages that aren't there on production declare it (only!) in the 'dependencies' " +
        'section of your package.json. If this module is development only - add it to the ' +
        'from.pathNot re of the not-to-dev-dep rule in the dependency-cruiser configuration',
      from: {
        path: '^(src)',
        pathNot: '\\.(test|spec)\\.(js|mjs|cjs|ts)$',
      },
      to: {
        dependencyTypes: ['npm-dev'],
        pathNot: ['node_modules/@types/'],
      },
    },
    {
      name: 'optional-deps-used',
      severity: 'info',
      comment:
        'This module depends on an npm package that is declared as an optional dependency ' +
        "in your package.json. As this makes sense in limited situations only, it's flagged here. " +
        "If you're using an optional dependency here by design - add an exception to your " +
        'dependency-cruiser configuration.',
      from: {},
      to: {
        dependencyTypes: ['npm-optional'],
      },
    },
    {
      name: 'peer-deps-used',
      comment:
        'This module depends on an npm package that is declared as a peer dependency ' +
        'in your package.json. This makes sense if your package is e.g. a plugin, but in ' +
        'other cases - maybe not so much. If the use of a peer dependency is intentional ' +
        'add an exception to your dependency-cruiser configuration.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['npm-peer'],
      },
    },
  ],
  options: {
    /* conditions to resolve to for all modules (ESM, CommonJS, ...). See
       https://nodejs.org/api/packages.html#nested-conditions for details. */
    doNotFollow: {
      path: 'node_modules',
    },

    tsPreCompilationDeps: true,
    /* TypeScript project file ('tsconfig.json') to use for
       (1) compilation and
       (2) resolution (e.g. with the paths property)

       The (optional) fileName attribute specifies which file to take (relative to
       dependency-cruiser's current working directory). When not provided defaults to
       './tsconfig.json'. */
    tsConfig: {
      fileName: 'tsconfig.json',
    },

    /* if you have a babel config file in a non-default location
       you can specify the location here. Defaults to trying to find
       '.babelrc', '.babelrc.json', '.babelrc.js' and then
       babel.config.js. See node-to-json on how to specify this. */
    // babelConfig: {
    //   fileName: './babelconfig.json'
    // },

    /* if you have a webpack config file, specify the location here (relative to the
       current working directory). Dependency-cruiser will use it to know which
       modules are available to your code base. */
    // webpackConfig: {
    //   fileName: './webpack.config.js'
    // },

    /* Optionally list of extensions to scan
       when not provided defaults to ['.js', '.mjs', '.ts', '.tsx', '.jsx'] */
    // extensions: ['.js', '.mjs', '.ts', '.tsx'],

    /* List of module systems to use for following dependencies. When not provided,
       defaults to ['es6', 'cjs', 'amd'] */
    // moduleSystems: ['es6', 'cjs'],

    /* prefix for links in html and svg output (e.g. 'https://github.com/you/yourrepo/blob/develop/'
       to open it on your online repo - GitHub, GitLab, Bitbucket, etc.) */
    // prefix: '',

    /* false (the default): ignore dependencies that only exist before typescript-to-javascript compilation
       true: also detect dependencies that only exist before typescript-to-javascript compilation
       "specify": for each dependency determine how to deal with it separately */
    // preserveSymlinks: false,

    /* TypeScript project file ('tsconfig.json') to use for
       (1) compilation and
       (2) resolution (e.g. with the paths property)

       The (optional) fileName attribute specifies which file to take (relative to
       dependency cruiser's current working directory). When not provided defaults to
       './tsconfig.json'.

       The (optional) compilation attribute specifies which type of compilation to use:
       - 'diagnostics': uses the typescript compiler to check for errors
       - 'internal': uses typescript's internal transpiler
       - 'external': uses the typescript compiler configured by the tsconfig
       When not provided defaults to 'diagnostics'
    */
    // tsConfig: {
    //   fileName: './tsconfig.json',
    //   compilation: 'diagnostics'
    // },

    /* How to resolve external modules - use "yarn-pnp" if you're using yarn's Plug'n'Play.
       otherwise leave it out (or set to the default 'node_modules') */
    // externalModuleResolutionStrategy: 'node_modules',

    /* List of strings you have in use in addition to cjs/ es6 requires
       & imports to declare module dependencies with. Use this e.g. if you've
       re-declared require, use a require-wrapper or use window.require as
       a hack */
    // exoticRequireStrings: [],

    /* options to tweak the output of reporters */
    reporterOptions: {
      dot: {
        /* pattern of modules that can be consolidated in the detailed
           graphical dependency graph. The default pattern in this configuration
           collapses everything in node_modules to one folder deep so you see
           the external modules, but not the innards your app depends upon.
         */
        collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)',

        /* Options to tweak the appearance of your graph.See
           https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md#reporteroptions
           for details and some examples. If you don't specify a theme
           don't worry - dependency-cruiser will fall back to the default one.
        */
        // theme: {
        //   graph: {
        //     /* graph direction - either 'top-down' or 'left-to-right'. Defaults to
        //        'top-down' if not specified. */
        //     direction: 'top-down',
        //   },
        // },
      },
      archi: {
        /* pattern of modules that can be consolidated in the high level
          graphical dependency graph. If you use the high level graphical
          dependency graph reporter (`archi`) you probably want to tweak
          this collapsePattern to your situation.
        */
        collapsePattern:
          '^(?:packages|src|lib|app|bin|test|spec)/[^/]+|node_modules/(?:@[^/]+/[^/]+|[^/]+)',

        /* Options to tweak the appearance of your graph.See
           https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md#reporteroptions
           for details and some examples. If you don't specify a theme
           for 'archi' dependency-cruiser will use the one specified in the
           dot reporter - see above - instead.
        */
        // theme: {
        // },
      },
    },
  },
};
