var wizard_graphics = function(bind_elem_id,scenes,callback){
  var engines = [];
  var load = function(new_scenes,callback_fn){
    document.getElementById(bind_elem_id).innerHTML = '';
    for(var i = 0, il = new_scenes.length; i < il; i++){
      if(engines[i]) engines[i].destroy();
      engines[i] = wizard_graphics.engines.canvas_graphics(bind_elem_id,i);
      new_scenes[i](engines[i]);
    };
    if(callback_fn){
      callback_fn({
          'load':load,
          'draw':function(engine_index){
            if(engine_index !== undefined){
              engines[engine_index].draw();
            }else{
              for(var i = 0, il = engines.length; i < il; i++){
                engines[i].draw();
              };
            };
          }
        });
    };
  };
  load(scenes,callback);
};
wizard_graphics.engines = {};
wizard_graphics.engines.canvas_graphics = function(bind_elem_id,depth){
  var canvas_elem = wizard_graphics.engines.canvas_graphics.bind_to_elem(bind_elem_id,depth),
      context = canvas_elem.getContext('2d'),
      canvas = context.canvas,
      width = canvas.width,
      height = canvas.height,
      display_manager = wizard_graphics.engines.canvas_graphics.display_manager();
  var draw_display_object = function(displayable){
    displayable.trigger('draw');
    context.save();
    context.globalAlpha = displayable.style['alpha'];
    context.translate(displayable.x,displayable.y);
    context.rotate(displayable.rotation * Math.PI / 180);
    if(displayable.style['border-width'] > 0){
      context.strokeStyle = displayable.style['border-color'];
      context.lineWidth = displayable.style['border-width'];
    };
    context.fillStyle = displayable.style['background-color'];
    if(displayable.vertices.length > 0){
      context.beginPath();
      var vertex;
      for(var i = 0, il = displayable.vertices.length; i < il; i++){
        vertex = displayable.vertices[i];
        if(i === 0){
          context.moveTo(vertex.x,vertex.y);
        }else{
          context.lineTo(vertex.x,vertex.y);
        };
      };
      if(displayable.$$line !== true){
        context.closePath();
      };
      context.fill();
      if(displayable.style['border-width'] > 0) context.stroke();
      context.restore();
    };
  };
  var clear_canvas = function(){
    context.save();
    context.clearRect(0,0,width,height);
    context.restore();
  };
  var return_obj = {};
  wizard_graphics.event_dispatcher(return_obj);
  return_obj.index = depth;
  return_obj.width = width;
  return_obj.height = height;
  return_obj.add = function(displayable){
    display_manager.add(displayable);
  };
  return_obj.draw = function(){
    canvas.width = canvas.width;
    clear_canvas();
    display_manager.map(draw_display_object);
    return_obj.trigger('draw');
  };
  return_obj.destroy = function(){
    return_obj.clear_bindings();
    display_manager.destroy();
  };
  return return_obj;
};
wizard_graphics.engines.canvas_graphics.display_manager = function(){
  var displayables = [],
      highest_depth = -1,
      lookup = {};
  var return_obj = {
    'add':function(displayable){
      if(displayable.$$depth === undefined){
        highest_depth += 1;
        displayable.$$depth = highest_depth;
      };
      if(displayable.$$depth > highest_depth){
        highest_depth = displayable.$$depth;
      };
      var d = displayable.$$depth;
      if(displayables[d] === undefined){
        displayables[d] = [];
      };
      lookup[displayable.$$id] = displayables[d].length;
      displayables[d][displayables[d].length] = displayable;
    },
    'map':function(callback){
      for(var i = 0, il = displayables.length, j, jl; i < il; i++){
        for(j = 0, jl = displayables[i].length; j < jl; j++){
          if(displayables[i] !== undefined && displayables[i][j] !== undefined){
            callback(displayables[i][j]);
          };
        };
      };
    },
    'destroy':function(){
      return_obj.map(function(displayable){
        displayable.clear_bindings();
      });
      displayables = [];
      lookup = {};
      highest_depth = -1;
    }
  };
  return return_obj;
};
wizard_graphics.engines.canvas_graphics.bind_to_elem = function(node_id,depth){
  var bind_elem = document.getElementById(node_id),
      canvas_elem = document.createElement('canvas'),
      width = bind_elem.offsetWidth,
      height = bind_elem.offsetHeight;
  canvas_elem.id = node_id + '_' + depth;
  if(depth > 0){
    canvas_elem.style.marginTop = (0 - height) + 'px';
  };
  canvas_elem.style.display = 'block';
  canvas_elem.width = width;
  canvas_elem.height = height;
  bind_elem.appendChild(canvas_elem);
  return canvas_elem;
};
wizard_graphics.event_dispatcher = function(obj){
  var lookup = {},
      subscribers = {};
  obj.bind = function(type,callback){
    if(!subscribers[type]){
      subscribers[type] = [];
    };
    var l = subscribers[type].length;
    subscribers[type][l] = callback;
    lookup[callback] = {'index':l,'type':type};
  };
  obj.trigger = function(type,data){
    if(subscribers[type] === undefined){
      return;
    };
    for(var i = 0, il = subscribers[type].length; i < il; i++){
      var subscriber = subscribers[type][i];
      if(subscriber && subscriber.call){
        subscriber.call(obj,data);
      };
    };
  };
  obj.clear_bindings = function(){
    for(var callback in lookup){
      var binding = lookup[callback];
      subscribers[binding.type][binding.index] = undefined;
      delete lookup[callback];
    };
  };
  return obj;
};
wizard_graphics.convert_to_radians = function(deg){
  return Math.PI / 180 * deg;
};
wizard_graphics.new_global_id = function(){
  var chars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G'],
      uuid = [],
      r,
      i = 36;
  uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
  uuid[14] = '4';
  while (i--) {
    if (!uuid[i]) {
      r = Math.random()*16|0;
      uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
    }
  }
  return uuid.join('');
};
wizard_graphics.display_object = function(x,y,style){
  var style = style || {},
      self = wizard_graphics.event_dispatcher({});
  self.x = x;
  self.y = y;
  self.rotation = 0;
  self.$$id = wizard_graphics.new_global_id();
  self.vertices = [];
  self.style = {
      'background-color':(style['background-color'] || 'rgba(0,0,0,0)'),
      'border-width':(style['border-width'] || 0),
      'border-color':(style['border-color'] || 'rgba(0,0,0,0)'),
      'alpha':(style['alpha'] || 1.0)
    };
  self.add_vertex = function(x,y){
    self.vertices[self.vertices.length] = {'x':x,'y':y};
  };
  return self;
};
wizard_graphics.display_object.rectangle = function(x,y,width,height,style){
  var self = wizard_graphics.display_object(x,y,style);
  self.width = width;
  self.height = height;
  self.add_vertex(0,0);
  self.add_vertex(self.width,0);
  self.add_vertex(self.width,self.height);
  self.add_vertex(0,self.height);
  return self;
};
wizard_graphics.display_object.polygon = function(x,y,radius,edge_count,style){
  var self = wizard_graphics.display_object(x,y,style);
  self.radius = radius;
  self.edge_count = edge_count;
  var point_index,
      point_increment = 360 / self.edge_count,
      plot_x,
      plot_y;
  for(point_index = 0; point_index <= 360; point_index += point_increment){
    plot_x = Math.sin(wizard_graphics.convert_to_radians(point_index + self.rotation + 180)) * (0 - self.radius);
    plot_y = Math.cos(wizard_graphics.convert_to_radians(point_index + self.rotation + 180)) * self.radius;
    self.add_vertex(plot_x,plot_y);
  };
  return self;
};
