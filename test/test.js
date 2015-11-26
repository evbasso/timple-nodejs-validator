var Validator = require('../validator.js');
var assert = require('assert');

var userValidator = null;

describe('Validator',function(){
	describe('Schema Create',function(){
		it('should create schema with no expections',function(){
			 userValidator = new Validator('Usuário');
			 assert.notEqual(null,userValidator);			
		});
	});
	
	describe('Create Properties',function(){
		it('should create guid property',function(){
			userValidator.Property('id','Id')
				.IsGuid()
				.GenerateGuid()
				;
		});
		
		it('should create name property',function(){
			userValidator.Property('name','Nome')
				.IsName()
				.IsRequired()
				.MinLength(10)
				.MaxLength(100)
				;
		});
		
		it('should create email property',function(){
			userValidator.Property('email','E-mail')
				.IsEmail()
				.IsRequired()
				;
		});
		
		it('should create Number property',function(){
			userValidator.Property('idade','Idade')
				.IsNumber()
				.IsRequired()
				.Min(18)
				.Max(70)
				;
		});
		
		it('should create Date property',function(){
			userValidator.Property('nascimento','Data de Nascimento')
				.IsDate()
				.IsRequired()
				;
		});
		
		it('should crate Enum property',function(){
			userValidator.Property('sexo','Sexo')
				.IsEnum(['M','F'])
				.IsRequired()
				;
		});
		
		it('should create Customer validator',function(){
			userValidator.CustomValidator(function(user){
				if(user.sexo == 'M' && user.idade < 21)
					throw "Homens somente com 21 anos ou mais";
					
				return user;
			});
		});
		
	});
	
	describe('Run Validations',function(){
		var user = null;
		var arErrors = null;
		
		it('Create User',function(){
			user = userValidator.from({
				outraCoisa:'outraCoisa',
				name: 'Meu',
				email: 'meuemail@ea.co',
				idade: 1,
				sexo: 'M',
				nascimento: '10/10/2016'
			});
		});
		
		it('Validate User',function(){
			arErrors = user.$validate();
		});
		
		it('Contain Errors',function(){
			assert.notEqual(null,arErrors);
			assert.notEqual(0,arErrors);
		});
		
		it('Generate GUID',function(){
			assert.notEqual(user.id,null);
		});
		
		it('Prepare object error',function(){
			user.name = 'Nome real com mais de dez';
			user.idade = 18;
			user.sexo = 'M';
		});
		
		it('Run Custom Validator',function(){
			arErrors = user.$validate();
			
			assert.notEqual(null,arErrors);
			assert.equal(1,arErrors.length);
		});
		
		it('Fix User',function(){
			user.idade = 21;
		});
		
		it('Accepts User',function(){
			arErrors = user.$validate();
			
			assert.equal(null,arErrors);
		});
	
	});
});
