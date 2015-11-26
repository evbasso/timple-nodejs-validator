'use strict'

var Guid = require('guid');

/**
 * (C) 2015 Everton T B Araujo
 */

function PipelinedObject(){
	this.pipeline = [];
	this.title = '';
}

PipelinedObject.prototype.runPipeline = function(value){
	var self = this;
	var pipeline = self.pipeline;
	var arVal = [value];
	var errors = [];
	
	for(var p in pipeline){
		var pp = pipeline[p];
		
		var arg = pp.args ? arVal.concat(pp.args) : arVal;
		
		try{
			arVal[0] = pp.fn.apply(self,arg);
		}catch(erro){
			errors.push(self.title + ": "+ erro);
		}
	}
	
	if(errors.length)
		throw errors;

	return arVal[0];
}

PipelinedObject.prototype.addPipeline = function(fn,args){
	this.pipeline.push({
		fn:fn,
		args: Array.isArray(args) ? [args] : args
	});
	return this;
}

PipelinedObject.prototype.CustomValidator = function(fn){
	this.addPipeline(fn);
}

/**
 * Define a propriedade de um objeto, com facilitadores de validação
 */
function SchemaProperty(schema, name,title){
	PipelinedObject.call(this);
	
	this.name = name;
	this.title = title || name;
	this.schema = schema;
	this.pipeline = [];
}
SchemaProperty.prototype = Object.create(PipelinedObject.prototype);
SchemaProperty.prototype.constructor = SchemaProperty;

SchemaProperty.prototype.IsString = function(){
	this.addPipeline(function(value){
		if(value && typeof value != "string")
			return value.toString();
		
		return value;
	});
	return this;
}

SchemaProperty.prototype.IsGuid = function(){
	return this.addPipeline(function(value){
		if(value && !Guid.isGuid(value))
			throw "GUID inválido";
		
		return value;
	});
}

SchemaProperty.prototype.GenerateGuid = function(){
	return this.addPipeline(function(value){
		if(!value)
			return Guid.create().value;
			
		return value;
	});
}

SchemaProperty.prototype.HasDefaultValue = function(val){
	this.addPipeline(function(value, defaultValue){
		if(value)
			return value;
		
		if(defaultValue instanceof Function)
			return defaultValue();
		
		return defaultValue;
		
	},val);
}

SchemaProperty.prototype.IsEnum = function(validValues){
	return this.addPipeline(function(value,valids){
		if(value && valids.indexOf(value) < 0)
			throw "Opção inválida";
		
		return value;
	},validValues);
}

SchemaProperty.prototype.TruncateTime = function(){
	return this.addPipeline(function(value){
		return new Date(value.getTime() - (value.getTime() % 86400000));
	});
}

SchemaProperty.prototype.IsDate = function(){
	return this.addPipeline(function(value){
		if(!value)
			return value;
			
		var v = value instanceof Date ? value : new Date(value);
		
		if(isNaN(v.valueOf()))
			throw "Data inválida";
		
		return v;
	});
}

SchemaProperty.prototype.IsFuture = function(){
	return this.addPipeline(function(value){
		if(value && value.getTime() <= new Date().getTime())
			throw "Deve ser futuro";
			
		return value;
	});
}

SchemaProperty.prototype.IsPastWithMaxDays = function(days){
	return this.addPipeline(function(value,difDays){
		if(!value)
			return value;

		var dif = Date.now() - value.getTime();
		if(dif / 3600000 > difDays)
			throw "Máximo de "+difDays+" dias no passado";
		
		return value;
	},days);
}


SchemaProperty.prototype.IsPastWithMaxYears = function(years){
	return this.addPipeline(function(value,difYears){
		if(!value)
			return value;

		var now = new Date();
		
		if(now.getFullYear() - value.getFullYear() > difYears)
			throw "Máximo de "+difYears+" anos no passado";
		
		return value;
	},years);
}

SchemaProperty.prototype.IsNumber = function(){
	return this.addPipeline(function(value){
		var finalValue = value;
		if(value && (typeof value != "number" || isNaN(finalValue = parseFloat(value))) )
			throw "Número inválido";
		
		return finalValue;
	});
}

SchemaProperty.prototype.Precision = function(prec){
	return this.addPipeline(function(value,precision){
		return value.toFixed(20);
	},prec);
}

SchemaProperty.prototype.Scale = function(scal){
	return this.addPipeline(function(value,scale){
		return value.toFixed(scale);
	},scal);
}

SchemaProperty.prototype.Min = function(min){
	return this.addPipeline(function(value,minValue){
		if( value < minValue)
			throw "Valor mínimo "+minValue;
			
		return value;
	},min);
}

SchemaProperty.prototype.Max = function(max){
	return this.addPipeline(function(value,maxValue){
		if( value > maxValue)
			throw "Valor máximo "+maxValue;
		
		return value;
	},max);
}

SchemaProperty.prototype.IsRequired = function(){
	this.addPipeline(function(value){
		if(!value || value == "")
			throw "Obrigatório";
			
		return value;
	});
	return this;
}

SchemaProperty.prototype.MinLength = function(length){
	return this.addPipeline(function(value,len){
		if(!value || !value.length || value.length < len)
			throw "Tamanho mínimo "+len;
		
		return value;
	},length);
}

SchemaProperty.prototype.MaxLength = function(length){
	return this.addPipeline(function(value,len){
		if(!value || !value.length || value.length > len)
			throw "Tamanho máximo "+len;
		return value;	
	},length);
}

SchemaProperty.prototype.Trim = function(){
	return this.addPipeline(function(value){
		if(!value || typeof value != "string")
			return value;
			
		return value.trim();		
	});
}

SchemaProperty.prototype.IsEmail = function(){
	this.IsString();
	this.Trim();
	
	return this.addPipeline(function(value){
		if(value && !/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/.test(value))
			throw "E-mail inválido";
		
		return value;
	});
}

SchemaProperty.prototype.IsName = function(minLength,maxLength){
	this.IsString();
	this.Trim();
	return this.addPipeline(function(value,min,max){
		if(value && (value.length < min || value.length > max || !/^[a-z ,.'-]+$/i.test(value))) //!/^[a-zA-Z0-9]*[a-zA-Z]+[a-zA-Z0-9]*$/.test(value)))
			throw "Nome inválido";
	
		return value;
	},minLength||2,maxLength||Number.MAX_VALUE);
}

SchemaProperty.prototype.CustomValidator = function(fn){
	this.addPipeline(fn);
}


/**
 * Coleciona as definições de um objeto
 */
function Schema(title){
	PipelinedObject.call(this);
	
	this.properties = Object.create({});
	this.pipeline = [];
	this.title = title;
}

Schema.prototype = Object.create(PipelinedObject.prototype);
Schema.prototype.constructor = Schema;


Schema.prototype.Property = function(name,title){
	var prop = new SchemaProperty(this,name,title);
	this.properties[prop.name] = prop;
	return prop; 
}

Schema.prototype.validate = function(obj){
	var props = this.properties;
	var finalErrors = null;
	
	for(var p in props){
		try{
			obj[p] = props[p].runPipeline(obj[p]);
		}catch(errors){
			finalErrors = finalErrors || [];
			Array.prototype.push.apply(finalErrors,errors);
		}
	}
	
	try{
		this.runPipeline(obj);
	}catch(errors){
		finalErrors = finalErrors || [];
		Array.prototype.push.apply(finalErrors,errors);
	}
	
	return finalErrors;
}

Schema.prototype.from = function(sourceObject){
	var o = Object.create({});
	
	for(var k in this.properties){
		o[k] = sourceObject[k];
	}
	
	o.$validate = (function(schema,obj){
		return function(){	
			return schema.validate.call(schema,obj);
		};		
	})(this,o);
	
	return o;
}

Schema.ExtendProperty = function(key,fn){
	SchemaProperty.prototype[key] = fn;
}

module.exports = Schema;